import { NextResponse } from 'next/server';
import { retryFailedWebhooks } from '@/services/WebhookService';
import { logEvent, logError } from '@/lib/logger';

/**
 * Webhook Retry Worker
 * Retries failed webhooks with exponential backoff
 * 
 * This endpoint should be called by a cron job every 5-10 minutes
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

    // Retry failed webhooks
    const result = await retryFailedWebhooks(10); // Process up to 10 webhooks per run

    logEvent('webhook_retry_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'retry-webhooks-cron' });
    return NextResponse.json(
      { error: 'Failed to retry webhooks' },
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
