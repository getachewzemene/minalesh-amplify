import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { generateContractNumber, calculateRenewalEndDate } from '@/lib/contract';

/**
 * @swagger
 * /api/vendors/contracts/{id}/renew:
 *   post:
 *     summary: Renew a contract
 *     description: Create a new version of the contract for renewal
 *     tags: [Vendors, Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract ID to renew
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               renewalPeriodMonths:
 *                 type: integer
 *                 description: Override the default renewal period
 *               commissionRate:
 *                 type: number
 *                 description: New commission rate (if changed)
 *               paymentTerms:
 *                 type: string
 *                 description: Updated payment terms
 *     responses:
 *       201:
 *         description: Contract renewed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 */

async function renewContractHandler(
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

    // Get the contract to renew
    const currentContract = await prisma.vendorContract.findUnique({
      where: { id },
    });

    if (!currentContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (user.role !== 'admin' && currentContract.vendorId !== profile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate that the contract can be renewed
    if (currentContract.status !== 'active' && currentContract.status !== 'expired') {
      return NextResponse.json(
        { error: 'Only active or expired contracts can be renewed' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      renewalPeriodMonths,
      commissionRate,
      paymentTerms,
    } = body;

    // Calculate new dates
    const newStartDate = new Date(currentContract.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1); // Start day after current contract ends
    
    const periodMonths = renewalPeriodMonths || currentContract.renewalPeriodMonths || 12;
    const newEndDate = calculateRenewalEndDate(currentContract.endDate, periodMonths);

    // Generate new contract number
    const newContractNumber = await generateContractNumber();

    // Create the renewed contract
    const renewedContract = await prisma.vendorContract.create({
      data: {
        vendorId: currentContract.vendorId,
        templateId: currentContract.templateId,
        contractNumber: newContractNumber,
        contractType: currentContract.contractType,
        status: 'pending_signature',
        version: currentContract.version + 1,
        parentContractId: currentContract.id,
        title: currentContract.title,
        content: currentContract.content,
        startDate: newStartDate,
        endDate: newEndDate,
        autoRenew: currentContract.autoRenew,
        renewalPeriodMonths: periodMonths,
        commissionRate: commissionRate || currentContract.commissionRate,
        paymentTerms: paymentTerms || currentContract.paymentTerms,
      },
    });

    // Update the old contract status
    await prisma.vendorContract.update({
      where: { id: currentContract.id },
      data: {
        status: 'renewed',
      },
    });

    // Create signature records for the new contract
    await Promise.all([
      prisma.contractSignature.create({
        data: {
          contractId: renewedContract.id,
          signerId: currentContract.vendorId,
          signerRole: 'vendor',
          status: 'pending',
        },
      }),
      // Admin signature will be created when admin reviews
    ]);

    // TODO: Send notification to vendor and admin about renewal

    return NextResponse.json(
      {
        message: 'Contract renewed successfully',
        contract: {
          id: renewedContract.id,
          contractNumber: renewedContract.contractNumber,
          version: renewedContract.version,
          status: renewedContract.status,
          startDate: renewedContract.startDate,
          endDate: renewedContract.endDate,
          parentContractId: renewedContract.parentContractId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error renewing contract:', error);
    throw error;
  }
}

export const POST = withApiLogger(
  withRoleCheck(renewContractHandler, ['vendor', 'admin'])
);
