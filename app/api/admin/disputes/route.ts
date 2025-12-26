import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/disputes:
 *   get:
 *     summary: List all disputes
 *     description: Get all disputes in the system (admin only)
 *     tags: [Admin, Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, pending_vendor_response, pending_admin_review, resolved, closed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [not_received, not_as_described, damaged, wrong_item, refund_issue, other]
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
 *         description: List of disputes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */

async function listDisputesHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              createdAt: true,
            },
          },
          vendor: {
            select: {
              displayName: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          messages: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    // Add message count to each dispute
    const disputesWithCount = disputes.map((dispute) => ({
      ...dispute,
      messageCount: dispute.messages.length,
      messages: undefined, // Remove messages array from response
    }));

    return NextResponse.json({
      disputes: disputesWithCount,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error listing disputes:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(listDisputesHandler, ['admin'])
);
