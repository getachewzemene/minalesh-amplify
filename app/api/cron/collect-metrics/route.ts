/**
 * Cron Job: Collect System Health Metrics
 * Should be triggered every 1-5 minutes by a cron scheduler
 * (Vercel Cron, GitHub Actions, or external service)
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectApplicationMetrics } from '@/lib/monitoring';
import { logEvent, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

/**
 * POST /api/cron/collect-metrics
 * Collect and record system health metrics
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  
  // Verify cron secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const executionId = crypto.randomUUID();
  const jobName = 'collect-system-metrics';
  
  try {
    const startTime = Date.now();
    
    // Collect all system metrics
    const metrics = await collectApplicationMetrics();
    
    const duration = Date.now() - startTime;
    
    logEvent(jobName, {
      executionId,
      duration,
      metricsCollected: metrics.length,
    });
    
    return NextResponse.json({
      success: true,
      executionId,
      duration,
      metricsCollected: metrics.length,
      metrics: metrics.map(m => ({
        type: m.type,
        value: m.value,
        unit: m.unit,
        status: m.status,
      })),
    });
  } catch (error) {
    logError(error, { operation: jobName, executionId });
    
    return NextResponse.json(
      {
        success: false,
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/collect-metrics
 * Returns information about this cron job (also triggers the job)
 */
export async function GET(req: NextRequest) {
  // Allow GET to trigger the job as well for easier manual testing
  return POST(req);
}
