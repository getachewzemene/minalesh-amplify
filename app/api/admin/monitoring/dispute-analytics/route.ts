import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/monitoring/dispute-analytics:
 *   get:
 *     summary: Get dispute analytics and trends
 *     description: Retrieve dispute resolution metrics and trends (admin only)
 *     tags: [Admin, Monitoring, Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Dispute analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */

async function getDisputeAnalyticsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    } else {
      // Default to last 30 days
      dateFilter.gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get total disputes
    const totalDisputes = await prisma.dispute.count({
      where: {
        createdAt: dateFilter,
      },
    });

    // Get disputes by status
    const disputesByStatus = await prisma.dispute.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    // Get disputes by type
    const disputesByType = await prisma.dispute.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    // Calculate average resolution time
    const resolvedDisputes = await prisma.dispute.findMany({
      where: {
        status: 'resolved',
        resolvedAt: {
          not: null,
        },
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTimeHours = 0;
    if (resolvedDisputes.length > 0) {
      const totalResolutionTime = resolvedDisputes.reduce((sum, dispute) => {
        if (dispute.resolvedAt) {
          const timeMs = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
          return sum + timeMs;
        }
        return sum;
      }, 0);
      avgResolutionTimeHours = totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60);
    }

    // Get refund statistics
    const refundStats = await prisma.dispute.aggregate({
      where: {
        refundProcessed: true,
        createdAt: dateFilter,
      },
      _count: {
        id: true,
      },
      _sum: {
        refundAmount: true,
      },
    });

    // Get daily trend data
    const dailyTrends = await prisma.disputeAnalytics.findMany({
      where: {
        date: dateFilter,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Resolution time distribution
    const resolutionTimeBuckets = {
      under_24h: 0,
      '24h_to_3days': 0,
      '3days_to_7days': 0,
      over_7days: 0,
    };

    resolvedDisputes.forEach(dispute => {
      if (dispute.resolvedAt) {
        const hours = (dispute.resolvedAt.getTime() - dispute.createdAt.getTime()) / (1000 * 60 * 60);
        if (hours < 24) resolutionTimeBuckets.under_24h++;
        else if (hours < 72) resolutionTimeBuckets['24h_to_3days']++;
        else if (hours < 168) resolutionTimeBuckets['3days_to_7days']++;
        else resolutionTimeBuckets.over_7days++;
      }
    });

    return NextResponse.json({
      summary: {
        totalDisputes,
        resolvedDisputes: resolvedDisputes.length,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100,
        refundsProcessed: refundStats._count.id,
        totalRefundAmount: refundStats._sum.refundAmount || 0,
      },
      byStatus: disputesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byType: disputesByType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      resolutionTimeBuckets,
      dailyTrends,
    });
  } catch (error) {
    console.error('Error fetching dispute analytics:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getDisputeAnalyticsHandler, ['admin'])
);
