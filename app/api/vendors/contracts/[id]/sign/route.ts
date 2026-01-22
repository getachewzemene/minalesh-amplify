import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/vendors/contracts/{id}/sign:
 *   put:
 *     summary: Sign a contract
 *     description: E-sign a vendor contract
 *     tags: [Vendors, Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatureData
 *             properties:
 *               signatureData:
 *                 type: string
 *                 description: Base64 encoded signature image or text
 *               accept:
 *                 type: boolean
 *                 description: Whether the signer accepts the contract
 *     responses:
 *       200:
 *         description: Contract signed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 */

async function signContractHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      );
    }

    // Get contract
    const contract = await prisma.vendorContract.findUnique({
      where: { id },
      include: {
        signatures: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (user.role !== 'admin' && contract.vendorId !== profile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if contract can be signed
    if (contract.status !== 'draft' && contract.status !== 'pending_signature') {
      return NextResponse.json(
        { error: 'Contract cannot be signed in current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { signatureData, accept = true } = body;

    if (!signatureData) {
      return NextResponse.json(
        { error: 'Signature data is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find or create signature record
    const signerRole = user.role === 'admin' ? 'admin' : 'vendor';
    let signature = contract.signatures.find(
      s => s.signerId === user.userId && s.signerRole === signerRole
    );

    if (!signature) {
      // Create new signature record
      signature = await prisma.contractSignature.create({
        data: {
          contractId: contract.id,
          signerId: user.userId,
          signerRole,
          status: accept ? 'signed' : 'rejected',
          signatureData: accept ? signatureData : null,
          ipAddress,
          userAgent,
          signedAt: accept ? new Date() : null,
          rejectionReason: !accept ? 'Declined by signer' : null,
        },
      });
    } else {
      // Update existing signature
      signature = await prisma.contractSignature.update({
        where: { id: signature.id },
        data: {
          status: accept ? 'signed' : 'rejected',
          signatureData: accept ? signatureData : null,
          ipAddress,
          userAgent,
          signedAt: accept ? new Date() : null,
          rejectionReason: !accept ? 'Declined by signer' : null,
        },
      });
    }

    // Check if all required signatures are complete
    const vendorSignature = contract.signatures.find(s => s.signerRole === 'vendor');
    const adminSignature = contract.signatures.find(s => s.signerRole === 'admin');

    let newStatus: any = contract.status;
    let signedAt = contract.signedAt;

    if (accept) {
      // If vendor signed, move to pending_signature (waiting for admin)
      if (signerRole === 'vendor' && (!adminSignature || adminSignature.status !== 'signed')) {
        newStatus = 'pending_signature';
      }
      
      // If both signed, activate the contract
      if (
        (signerRole === 'vendor' && adminSignature?.status === 'signed') ||
        (signerRole === 'admin' && vendorSignature?.status === 'signed')
      ) {
        newStatus = 'active';
        signedAt = new Date();
      }
    } else {
      // If rejected, move back to draft
      newStatus = 'draft';
    }

    // Update contract status
    const updatedContract = await prisma.vendorContract.update({
      where: { id },
      data: {
        status: newStatus,
        signedAt,
      },
      include: {
        signatures: {
          select: {
            id: true,
            signerRole: true,
            status: true,
            signedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: accept ? 'Contract signed successfully' : 'Contract declined',
      contract: {
        id: updatedContract.id,
        contractNumber: updatedContract.contractNumber,
        status: updatedContract.status,
        signedAt: updatedContract.signedAt,
        signatures: updatedContract.signatures,
      },
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    throw error;
  }
}

export const PUT = withApiLogger(
  withRoleCheck(signContractHandler, ['vendor', 'admin'])
);
