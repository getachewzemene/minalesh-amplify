import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/monitoring/export-analytics:
 *   get:
 *     summary: Get data export analytics
 *     description: Retrieve data export request metrics and trends (admin only)
 *     tags: [Admin, Monitoring]
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
 *         description: Export analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */

async function getExportAnalyticsHandler(request: Request): Promise<NextResponse> {
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

    // Get total export requests
    const totalRequests = await prisma.dataExportRequest.count({
      where: {
        createdAt: dateFilter,
      },
    });

    // Get exports by status
    const exportsByStatus = await prisma.dataExportRequest.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    // Get exports by format
    const exportsByFormat = await prisma.dataExportRequest.groupBy({
      by: ['format'],
      _count: {
        id: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    // Get recurring vs one-time
    const recurringStats = await prisma.dataExportRequest.groupBy({
      by: ['isRecurring'],
      _count: {
        id: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    // Calculate average processing time
    const completedExports = await prisma.dataExportRequest.findMany({
      where: {
        status: 'completed',
        completedAt: {
          not: null,
        },
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
        completedAt: true,
        fileSize: true,
      },
    });

    let avgProcessingTimeMinutes = 0;
    let avgFileSize = 0;
    if (completedExports.length > 0) {
      const totalProcessingTime = completedExports.reduce((sum, exp) => {
        if (exp.completedAt) {
          const timeMs = exp.completedAt.getTime() - exp.createdAt.getTime();
          return sum + timeMs;
        }
        return sum;
      }, 0);
      avgProcessingTimeMinutes = totalProcessingTime / completedExports.length / (1000 * 60);

      const totalFileSize = completedExports.reduce((sum, exp) => sum + (exp.fileSize || 0), 0);
      avgFileSize = totalFileSize / completedExports.length;
    }

    // Get failure rate
    const failedExports = await prisma.dataExportRequest.count({
      where: {
        status: 'failed',
        createdAt: dateFilter,
      },
    });

    const failureRate = totalRequests > 0 ? (failedExports / totalRequests) * 100 : 0;

    // Category usage (for exports with categories)
    const categoryUsage: Record<string, number> = {};
    const exportsWithCategories = await prisma.dataExportRequest.findMany({
      where: {
        createdAt: dateFilter,
        categories: {
          isEmpty: false,
        },
      },
      select: {
        categories: true,
      },
    });

    exportsWithCategories.forEach(exp => {
      exp.categories.forEach(category => {
        categoryUsage[category] = (categoryUsage[category] || 0) + 1;
      });
    });

    return NextResponse.json({
      summary: {
        totalRequests,
        completedRequests: completedExports.length,
        failedRequests: failedExports,
        failureRate: Math.round(failureRate * 100) / 100,
        avgProcessingTimeMinutes: Math.round(avgProcessingTimeMinutes * 100) / 100,
        avgFileSizeBytes: Math.round(avgFileSize),
      },
      byStatus: exportsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byFormat: exportsByFormat.reduce((acc, item) => {
        acc[item.format] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recurringVsOneTime: {
        recurring: recurringStats.find(s => s.isRecurring)?._count.id || 0,
        oneTime: recurringStats.find(s => !s.isRecurring)?._count.id || 0,
      },
      categoryUsage,
    });
  } catch (error) {
    console.error('Error fetching export analytics:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getExportAnalyticsHandler, ['admin'])
);
