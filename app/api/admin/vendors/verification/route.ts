import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/vendors/verification:
 *   get:
 *     summary: List all vendor verification requests
 *     description: Get all vendor verification requests (admin only)
 *     tags: [Admin, Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, suspended]
 *         description: Filter by verification status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of verification requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */

async function listVerificationsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [verifications, total] = await Promise.all([
      prisma.vendorVerification.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.vendorVerification.count({ where }),
    ]);

    // Get vendor details separately for each verification
    const verificationsWithVendor = await Promise.all(
      verifications.map(async (verification) => {
        const vendor = await prisma.profile.findUnique({
          where: { id: verification.vendorId },
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        });
        return {
          ...verification,
          vendor,
        };
      })
    );

    return NextResponse.json({
      verifications: verificationsWithVendor,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error listing verifications:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(listVerificationsHandler, ['admin'])
);
