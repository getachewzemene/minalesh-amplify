import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/monitoring/cron-jobs:
 *   get:
 *     summary: Get cron job execution history
 *     description: Retrieve execution history and statistics for all cron jobs (admin only)
 *     tags: [Admin, Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobName
 *         schema:
 *           type: string
 *         description: Filter by specific job name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, running]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Cron job execution history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */

async function getCronJobExecutionsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('jobName');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (jobName) where.jobName = jobName;
    if (status) where.status = status;

    // Get executions
    const executions = await prisma.cronJobExecution.findMany({
      where,
      take: limit,
      orderBy: { startedAt: 'desc' },
    });

    // Get statistics by job name
    const stats = await prisma.cronJobExecution.groupBy({
      by: ['jobName'],
      _count: {
        id: true,
      },
      _avg: {
        duration: true,
      },
      where: {
        status: 'success',
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Get failure counts
    const failures = await prisma.cronJobExecution.groupBy({
      by: ['jobName'],
      _count: {
        id: true,
      },
      where: {
        status: 'failed',
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Combine statistics
    const jobStats = stats.map(stat => {
      const failureCount = failures.find(f => f.jobName === stat.jobName)?._count.id || 0;
      const successCount = stat._count.id;
      const totalCount = successCount + failureCount;
      
      return {
        jobName: stat.jobName,
        successCount,
        failureCount,
        totalExecutions: totalCount,
        successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
        avgDuration: stat._avg.duration,
      };
    });

    return NextResponse.json({
      executions,
      statistics: jobStats,
    });
  } catch (error) {
    console.error('Error fetching cron job executions:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getCronJobExecutionsHandler, ['admin'])
);
