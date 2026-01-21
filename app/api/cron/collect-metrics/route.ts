/**
 * Cron Job: Collect System Health Metrics
 * Should be triggered every 1-5 minutes by a cron scheduler
 * (Vercel Cron, GitHub Actions, or external service)
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectApplicationMetrics } from '@/lib/monitoring';
import { recordCronExecution } from '@/lib/cron';

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
    console.log(`[Cron] Starting ${jobName} execution ${executionId}`);
    
    const startTime = Date.now();
    
    // Record cron job start
    await recordCronExecution(jobName, 'running', {
      executionId,
    });
    
    // Collect all system metrics
    const metrics = await collectApplicationMetrics();
    
    const duration = Date.now() - startTime;
    
    // Record successful completion
    await recordCronExecution(jobName, 'success', {
      executionId,
      duration,
      metricsCollected: metrics.length,
    });
    
    console.log(
      `[Cron] Completed ${jobName} in ${duration}ms. Collected ${metrics.length} metrics.`
    );
    
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
    console.error(`[Cron] Error in ${jobName}:`, error);
    
    // Record failure
    await recordCronExecution(jobName, 'failed', {
      executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
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
 * Returns information about this cron job
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: 'collect-system-metrics',
    description: 'Collects system health metrics (CPU, memory, disk, DB, queues)',
    schedule: '*/5 * * * *', // Every 5 minutes (recommended)
    endpoint: '/api/cron/collect-metrics',
    method: 'POST',
    authentication: 'Bearer token (CRON_SECRET)',
  });
}
