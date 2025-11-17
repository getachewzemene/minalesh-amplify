import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email';
import { logEvent, logError } from '@/lib/logger';

/**
 * Email Queue Worker
 * Processes pending emails from the queue
 * 
 * This endpoint should be called by a cron job every 1-5 minutes
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

    // Process email queue
    const result = await processEmailQueue(20); // Process up to 20 emails per run

    logEvent('email_queue_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'process-email-queue-cron' });
    return NextResponse.json(
      { error: 'Failed to process email queue' },
      { status: 500 }
    );
  }
}

/**
 * Allow POST method as well for manual triggering
 */
export async function POST(request: Request) {
  return GET(request);
}
