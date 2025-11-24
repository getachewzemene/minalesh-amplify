/**
 * Webhook Retry Service
 * 
 * Handles retrying failed webhooks with exponential backoff
 */

import prisma from '@/lib/prisma';
import { logError, logEvent } from '@/lib/logger';

// Configuration
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MINUTES = 1;
const MAX_RETRY_DELAY_MINUTES = 60;

/**
 * Calculate next retry time using exponential backoff
 */
function calculateNextRetryAt(retryCount: number): Date {
  // Exponential backoff: 1min, 2min, 4min, 8min, 16min, max 60min
  const delayMinutes = Math.min(
    INITIAL_RETRY_DELAY_MINUTES * Math.pow(2, retryCount),
    MAX_RETRY_DELAY_MINUTES
  );
  
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  
  return nextRetry;
}

/**
 * Process webhook by calling the appropriate handler
 * This simulates reprocessing the webhook event
 */
async function processWebhook(webhookEvent: {
  id: string;
  provider: string;
  eventId: string | null;
  orderId: string | null;
  payload: any;
  signature: string | null;
  signatureHash: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll just validate the webhook data
    // In a real implementation, this would call the payment webhook handler
    // or other webhook handlers based on the provider
    
    if (!webhookEvent.orderId) {
      return { success: false, error: 'Missing order ID' };
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: webhookEvent.orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // If order is already completed, mark webhook as processed
    if (order.paymentStatus === 'completed') {
      return { success: true };
    }

    // This worker primarily handles transient failures (network issues, service outages).
    // For webhooks with business logic errors (amount mismatch, invalid data), 
    // the original webhook handler should have already logged the error.
    // These typically need manual review rather than automatic retry.
    // This function can be extended to implement actual webhook reprocessing logic
    // based on the webhook provider and type.
    
    logEvent('webhook_retry_skipped', {
      webhookId: webhookEvent.id,
      provider: webhookEvent.provider,
      orderId: webhookEvent.orderId,
      reason: 'Webhook reprocessing requires provider-specific implementation',
    });

    return { success: false, error: 'Webhook reprocessing not implemented' };
  } catch (error) {
    logError(error, { operation: 'processWebhook', webhookId: webhookEvent.id });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retry failed webhooks
 * Called by the webhook retry cron job
 */
export async function retryFailedWebhooks(batchSize = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    // Get failed webhooks that are ready for retry
    const webhooks = await prisma.webhookEvent.findMany({
      where: {
        status: 'error',
        retryCount: {
          lt: MAX_RETRY_ATTEMPTS,
        },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
        archived: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: batchSize,
    });

    let succeeded = 0;
    let failed = 0;

    for (const webhook of webhooks) {
      const result = await retryWebhook(webhook.id);
      if (result) {
        succeeded++;
      } else {
        failed++;
      }
    }

    logEvent('webhook_retry_batch_processed', {
      processed: webhooks.length,
      succeeded,
      failed,
    });

    return {
      processed: webhooks.length,
      succeeded,
      failed,
    };
  } catch (error) {
    logError(error, { operation: 'retryFailedWebhooks' });
    throw error;
  }
}

/**
 * Retry a specific webhook
 */
async function retryWebhook(webhookId: string): Promise<boolean> {
  let webhook: Awaited<ReturnType<typeof prisma.webhookEvent.findUnique>> | null = null;
  
  try {
    // Get webhook event
    webhook = await prisma.webhookEvent.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      logError(new Error('Webhook not found'), { webhookId });
      return false;
    }

    // Check retry limit
    if (webhook.retryCount >= MAX_RETRY_ATTEMPTS) {
      await prisma.webhookEvent.update({
        where: { id: webhookId },
        data: {
          archived: true,
          errorMessage: `Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`,
        },
      });
      
      logEvent('webhook_retry_limit_reached', {
        webhookId,
        provider: webhook.provider,
        retryCount: webhook.retryCount,
      });
      
      return false;
    }

    // Attempt to process webhook
    const result = await processWebhook(webhook);
    const newRetryCount = webhook.retryCount + 1;

    if (result.success) {
      // Mark as processed
      await prisma.webhookEvent.update({
        where: { id: webhookId },
        data: {
          status: 'processed',
          processedAt: new Date(),
          retryCount: newRetryCount,
          errorMessage: null,
          nextRetryAt: null,
        },
      });

      logEvent('webhook_retry_succeeded', {
        webhookId,
        provider: webhook.provider,
        retryCount: newRetryCount,
      });

      return true;
    } else {
      // Schedule next retry or mark as failed
      const shouldRetry = newRetryCount < MAX_RETRY_ATTEMPTS;
      const nextRetryAt = shouldRetry ? calculateNextRetryAt(newRetryCount) : null;

      await prisma.webhookEvent.update({
        where: { id: webhookId },
        data: {
          status: 'error',
          retryCount: newRetryCount,
          errorMessage: result.error || 'Unknown error',
          nextRetryAt,
          archived: !shouldRetry,
        },
      });

      logEvent('webhook_retry_failed', {
        webhookId,
        provider: webhook.provider,
        retryCount: newRetryCount,
        shouldRetry,
        nextRetryAt: nextRetryAt?.toISOString(),
        error: result.error,
      });

      return false;
    }
  } catch (error) {
    // Handle unexpected errors - use webhook from outer scope if available
    logError(error, { operation: 'retryWebhook', webhookId });
    
    // If we have the webhook from the initial fetch, use it to avoid duplicate query
    if (webhook) {
      const newRetryCount = webhook.retryCount + 1;
      const shouldRetry = newRetryCount < MAX_RETRY_ATTEMPTS;
      const nextRetryAt = shouldRetry ? calculateNextRetryAt(newRetryCount) : null;

      await prisma.webhookEvent.update({
        where: { id: webhookId },
        data: {
          status: 'error',
          retryCount: newRetryCount,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          nextRetryAt,
          archived: !shouldRetry,
        },
      });
    }

    return false;
  }
}

/**
 * Get webhook retry statistics
 */
export async function getWebhookRetryStats(): Promise<{
  pendingRetries: number;
  failedWebhooks: number;
  archivedWebhooks: number;
}> {
  try {
    const [pendingRetries, failedWebhooks, archivedWebhooks] = await Promise.all([
      prisma.webhookEvent.count({
        where: {
          status: 'error',
          retryCount: { lt: MAX_RETRY_ATTEMPTS },
          archived: false,
        },
      }),
      prisma.webhookEvent.count({
        where: {
          status: 'error',
          archived: false,
        },
      }),
      prisma.webhookEvent.count({
        where: {
          archived: true,
        },
      }),
    ]);

    return {
      pendingRetries,
      failedWebhooks,
      archivedWebhooks,
    };
  } catch (error) {
    logError(error, { operation: 'getWebhookRetryStats' });
    throw error;
  }
}
