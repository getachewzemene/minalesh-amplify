import { NextResponse } from 'next/server';
import { processAutoRefundsForSLAViolations } from '@/lib/buyer-protection';
import { logEvent, logError } from '@/lib/logger';

/**
 * Auto-Refund SLA Violations Worker
 *
 * Automatically refunds orders with buyer protection enabled
 * where the vendor hasn't shipped within the SLA deadline.
 *
 * This endpoint should be called by a cron job every 1-2 hours
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

    logEvent('auto_refund_sla_cron_started', {});

    const result = await processAutoRefundsForSLAViolations();

    logEvent('auto_refund_sla_cron_completed', {
      processed: result.processed,
      refunded: result.refunded,
      errors: result.errors.length,
    });

    if (result.errors.length > 0) {
      logError(new Error('Some auto-refunds failed'), {
        operation: 'auto-refund-sla-cron',
        errors: result.errors,
      });
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      refunded: result.refunded,
      errors: result.errors,
    });
  } catch (error) {
    logError(error, { operation: 'auto-refund-sla-cron' });
    return NextResponse.json(
      { error: 'Failed to process auto-refunds' },
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
