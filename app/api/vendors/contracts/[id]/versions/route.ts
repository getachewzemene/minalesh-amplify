import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/vendors/contracts/{id}/versions:
 *   get:
 *     summary: Get contract version history
 *     description: Retrieve all versions of a contract (version chain)
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
 *         description: Contract version history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 */

async function getContractVersionsHandler(
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

    // Get the contract
    const contract = await prisma.vendorContract.findUnique({
      where: { id },
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

    // Build the version chain
    // First, find the root contract (the one with no parent)
    let rootContract = contract;
    while (rootContract.parentContractId) {
      const parent = await prisma.vendorContract.findUnique({
        where: { id: rootContract.parentContractId },
      });
      if (!parent) break;
      rootContract = parent;
    }

    // Now get all versions in the chain from root to current
    const versions: any[] = [];
    let currentVersion = rootContract;
    
    while (currentVersion) {
      const versionData = await prisma.vendorContract.findUnique({
        where: { id: currentVersion.id },
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

      if (versionData) {
        versions.push({
          id: versionData.id,
          contractNumber: versionData.contractNumber,
          version: versionData.version,
          status: versionData.status,
          title: versionData.title,
          startDate: versionData.startDate,
          endDate: versionData.endDate,
          signedAt: versionData.signedAt,
          createdAt: versionData.createdAt,
          terminationDate: versionData.terminationDate,
          signatures: versionData.signatures,
          isCurrent: versionData.id === id,
        });
      }

      // Get the next version (child contract)
      const nextVersion = await prisma.vendorContract.findFirst({
        where: { parentContractId: currentVersion.id },
      });

      currentVersion = nextVersion;
    }

    return NextResponse.json({
      contractId: id,
      totalVersions: versions.length,
      versions,
    });
  } catch (error) {
    console.error('Error fetching contract versions:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getContractVersionsHandler, ['vendor', 'admin'])
);
