import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/vendors/contracts/{id}/terminate:
 *   put:
 *     summary: Terminate a contract
 *     description: Terminate an active vendor contract
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for termination
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the termination takes effect (defaults to now)
 *     responses:
 *       200:
 *         description: Contract terminated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 */

async function terminateContractHandler(
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
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check access permissions (only admin or contract owner can terminate)
    if (user.role !== 'admin' && contract.vendorId !== profile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if contract can be terminated
    if (contract.status === 'terminated') {
      return NextResponse.json(
        { error: 'Contract is already terminated' },
        { status: 400 }
      );
    }

    if (contract.status !== 'active' && contract.status !== 'pending_signature') {
      return NextResponse.json(
        { error: 'Only active or pending contracts can be terminated' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, effectiveDate } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Termination reason is required' },
        { status: 400 }
      );
    }

    const terminationDate = effectiveDate ? new Date(effectiveDate) : new Date();

    // Update contract
    const updatedContract = await prisma.vendorContract.update({
      where: { id },
      data: {
        status: 'terminated',
        terminationDate,
        terminationReason: reason,
        terminatedBy: user.userId,
      },
    });

    // TODO: Send notification emails to vendor and admin
    // TODO: Log the termination in audit log

    return NextResponse.json({
      message: 'Contract terminated successfully',
      contract: {
        id: updatedContract.id,
        contractNumber: updatedContract.contractNumber,
        status: updatedContract.status,
        terminationDate: updatedContract.terminationDate,
        terminationReason: updatedContract.terminationReason,
      },
    });
  } catch (error) {
    console.error('Error terminating contract:', error);
    throw error;
  }
}

export const PUT = withApiLogger(
  withRoleCheck(terminateContractHandler, ['vendor', 'admin'])
);
