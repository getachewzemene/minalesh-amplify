/**
 * Cron Job: Process Subscription Deliveries
 * Runs daily to create orders for subscriptions due for delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getSubscriptionsDueForDelivery,
  processSubscriptionDelivery,
} from '@/lib/subscription';

// Verify cron secret for security
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true; // Allow in development
  
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/cron/process-subscriptions
 * Process all subscriptions due for delivery
 */
export async function POST(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    // Log job start
    const execution = await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-subscriptions',
        status: 'running',
      },
    });

    // Get all subscriptions due for delivery
    const subscriptions = await getSubscriptionsDueForDelivery();

    console.log(`Processing ${subscriptions.length} subscription deliveries`);

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Check product stock
        const product = await prisma.product.findUnique({
          where: { id: subscription.productId },
          select: { stockQuantity: true, isActive: true },
        });

        if (!product || !product.isActive) {
          throw new Error('Product no longer available');
        }

        if (product.stockQuantity < subscription.quantity) {
          throw new Error('Insufficient stock');
        }

        // Process the delivery
        await processSubscriptionDelivery(subscription.id);
        processed++;

        // TODO: Send notification email to user
        // await sendSubscriptionDeliveryEmail(subscription.user.email, order);

      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Subscription ${subscription.id}: ${message}`);
        console.error(`Failed to process subscription ${subscription.id}:`, error);

        // Update subscription status if there's a persistent issue
        if (message === 'Product no longer available') {
          await prisma.productSubscription.update({
            where: { id: subscription.id },
            data: {
              status: 'paused',
              pausedAt: new Date(),
            },
          });
        }
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Update job execution record
    await prisma.cronJobExecution.update({
      where: { id: execution.id },
      data: {
        status: failed === subscriptions.length && subscriptions.length > 0 ? 'failed' : 'success',
        completedAt,
        duration,
        recordsProcessed: processed,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        metadata: {
          totalSubscriptions: subscriptions.length,
          processed,
          failed,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} subscription deliveries`,
      stats: {
        total: subscriptions.length,
        processed,
        failed,
        duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in process-subscriptions cron:', error);
    
    // Log failed execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-subscriptions',
        status: 'failed',
        completedAt: new Date(),
        duration: new Date().getTime() - startedAt.getTime(),
        recordsProcessed: processed,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to process subscriptions' },
      { status: 500 }
    );
  }
}
