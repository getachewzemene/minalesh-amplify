import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';

/**
 * Dispute Analytics Aggregation Cron Job
 * Aggregates dispute metrics daily for analytics dashboard
 * 
 * This endpoint should be called by a cron job daily at midnight
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Get yesterday's date (we aggregate data for the previous day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    // Check if we already have analytics for yesterday
    const existingAnalytics = await prisma.disputeAnalytics.findUnique({
      where: { date: yesterday },
    });

    if (existingAnalytics) {
      return NextResponse.json({
        success: true,
        message: 'Analytics for this date already exist',
        date: yesterday,
      });
    }

    // Get disputes created yesterday
    const disputes = await prisma.dispute.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        refundProcessed: true,
        refundAmount: true,
      },
    });

    // Calculate metrics
    const totalDisputes = disputes.length;
    const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'pending_vendor_response' || d.status === 'pending_admin_review').length;
    const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;

    // Calculate average resolution time
    const resolvedDisputesWithTime = disputes.filter(d => d.resolvedAt);
    let avgResolutionTimeHours = 0;
    if (resolvedDisputesWithTime.length > 0) {
      const totalResolutionTime = resolvedDisputesWithTime.reduce((sum, dispute) => {
        if (dispute.resolvedAt) {
          const timeMs = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
          return sum + timeMs;
        }
        return sum;
      }, 0);
      avgResolutionTimeHours = totalResolutionTime / resolvedDisputesWithTime.length / (1000 * 60 * 60);
    }

    // Group by type
    const disputesByType: Record<string, number> = {};
    disputes.forEach(dispute => {
      disputesByType[dispute.type] = (disputesByType[dispute.type] || 0) + 1;
    });

    // Refund statistics
    const refundsProcessed = disputes.filter(d => d.refundProcessed).length;
    const totalRefundAmount = disputes.reduce((sum, d) => sum + (d.refundAmount || 0), 0);

    // Create analytics record
    await prisma.disputeAnalytics.create({
      data: {
        date: yesterday,
        totalDisputes,
        openDisputes,
        resolvedDisputes,
        avgResolutionTimeHours,
        disputesByType,
        refundsProcessed,
        totalRefundAmount,
      },
    });

    const duration = Date.now() - startTime;

    // Log execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'aggregate-dispute-analytics',
        status: 'success',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
        recordsProcessed: 1,
        metadata: {
          date: yesterday,
          totalDisputes,
          resolvedDisputes,
        },
      },
    });

    logEvent('dispute_analytics_aggregated', {
      date: yesterday,
      totalDisputes,
      resolvedDisputes,
      duration,
    });

    return NextResponse.json({
      success: true,
      date: yesterday,
      metrics: {
        totalDisputes,
        openDisputes,
        resolvedDisputes,
        avgResolutionTimeHours,
        refundsProcessed,
        totalRefundAmount,
      },
    });
  } catch (error) {
    logError(error, { operation: 'aggregate-dispute-analytics-cron' });
    
    // Log failed execution
    try {
      await prisma.cronJobExecution.create({
        data: {
          jobName: 'aggregate-dispute-analytics',
          status: 'failed',
          startedAt: new Date(),
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log cron execution:', logError);
    }

    return NextResponse.json(
      { error: 'Failed to aggregate dispute analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
