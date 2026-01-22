import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/vendors/contracts/{id}:
 *   get:
 *     summary: Get contract details
 *     description: Retrieve detailed information about a specific contract
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
 *     responses:
 *       200:
 *         description: Contract details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 */

async function getContractHandler(
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

    // Get contract with all related data
    const contract = await prisma.vendorContract.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            tradeLicense: true,
            tinNumber: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            contractType: true,
            version: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signerRole: true,
            status: true,
            signedAt: true,
            rejectionReason: true,
          },
        },
        parentContract: {
          select: {
            id: true,
            contractNumber: true,
            version: true,
          },
        },
        childContracts: {
          select: {
            id: true,
            contractNumber: true,
            version: true,
            status: true,
          },
        },
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

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getContractHandler, ['vendor', 'admin'])
);
