import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/contracts:
 *   get:
 *     summary: List all vendor contracts
 *     description: Get all contracts across all vendors (admin only)
 *     tags: [Admin, Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_signature, active, expired, terminated, renewed]
 *         description: Filter by contract status
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [standard, premium, enterprise, custom]
 *         description: Filter by contract type
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of all contracts
 *       401:
 *         description: Unauthorized
 */

async function listAllContractsHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractType = searchParams.get('contractType');
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const [contracts, total] = await Promise.all([
      prisma.vendorContract.findMany({
        where,
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
            },
          },
          signatures: {
            select: {
              id: true,
              signerRole: true,
              status: true,
              signedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: perPage,
      }),
      prisma.vendorContract.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.vendorContract.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      statistics: stats.reduce((acc: any, stat: any) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error listing contracts:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(listAllContractsHandler, ['admin'])
);
