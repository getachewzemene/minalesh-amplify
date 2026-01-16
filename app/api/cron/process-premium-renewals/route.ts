/**
 * Cron Job: Process Premium Subscription Renewals
 * Automatically renews premium subscriptions when their period ends
 * 
 * Runs daily to:
 * - Find subscriptions that have expired and need renewal
 * - Process payment (creates payment record)
 * - Extend subscription period
 * - Send confirmation or failure emails
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  sendEmail, 
  createSubscriptionRenewalSuccessEmail,
  createSubscriptionRenewalFailedEmail 
} from '@/lib/email';
import { PREMIUM_PRICING } from '@/lib/subscription';
import { addDays } from 'date-fns';

// Verify cron secret for security
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecretHeader = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true; // Allow in development
  
  return authHeader === `Bearer ${cronSecret}` || cronSecretHeader === cronSecret;
}

/**
 * POST /api/cron/process-premium-renewals
 * Process automatic premium subscription renewals
 */
export async function POST(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date();
  let renewed = 0;
  let failed = 0;
  let expired = 0;
  const errors: string[] = [];

  try {
    // Log job start
    const execution = await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-premium-renewals',
        status: 'running',
      },
    });

    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';
    const manageUrl = `${appUrl}/subscriptions`;

    // Find subscriptions that need renewal (period ended, auto-renew enabled)
    const subscriptionsToRenew = await prisma.premiumSubscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        currentPeriodEnd: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    console.log(`Processing ${subscriptionsToRenew.length} premium subscription renewals`);

    for (const subscription of subscriptionsToRenew) {
      try {
        // Get pricing based on plan type
        const isYearly = subscription.planType === 'premium_yearly';
        const pricing = isYearly ? PREMIUM_PRICING.yearly : PREMIUM_PRICING.monthly;
        
        // Calculate new period dates
        const newPeriodStart = now;
        const newPeriodEnd = addDays(now, pricing.daysInPeriod);

        /**
         * PRODUCTION PAYMENT INTEGRATION NOTE:
         * 
         * This is a SIMULATION for development/testing purposes.
         * 
         * In production, you must integrate with Stripe or another payment provider:
         * 1. Call Stripe API to charge the customer's saved payment method
         * 2. Handle payment failures with exponential backoff retry logic
         * 3. Only create payment record and extend subscription after payment confirmation
         * 4. Use webhooks to handle async payment confirmations
         * 
         * Example with Stripe:
         * const paymentIntent = await stripe.paymentIntents.create({
         *   amount: pricing.price * 100, // ETB in cents
         *   currency: 'etb',
         *   customer: subscription.stripeCustomerId,
         *   payment_method: subscription.stripePaymentMethodId,
         *   off_session: true,
         *   confirm: true,
         * });
         */

        // Create payment record (simulated - mark as completed for testing)
        const payment = await prisma.subscriptionPayment.create({
          data: {
            premiumSubscriptionId: subscription.id,
            amount: pricing.price,
            currency: 'ETB',
            status: 'completed', // In production: 'pending' until payment confirmed via webhook
            paymentMethod: subscription.paymentMethod,
            periodStart: newPeriodStart,
            periodEnd: newPeriodEnd,
            paidAt: now,
          },
        });

        // Update subscription with new period
        await prisma.premiumSubscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            priceAmount: pricing.price,
          },
        });

        renewed++;

        // Send renewal success email
        const planType = subscription.planType as 'premium_monthly' | 'premium_yearly';
        const emailTemplate = createSubscriptionRenewalSuccessEmail(
          subscription.user.email,
          planType,
          newPeriodEnd,
          pricing.price,
          manageUrl
        );

        await sendEmail(emailTemplate);

        console.log(`Renewed subscription for ${subscription.user.email}, next renewal: ${newPeriodEnd}`);

      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Subscription ${subscription.id}: ${message}`);
        console.error(`Failed to renew subscription ${subscription.id}:`, error);

        // Send renewal failure email
        const planType = subscription.planType as 'premium_monthly' | 'premium_yearly';
        const retryDate = addDays(now, 3); // Retry in 3 days
        
        try {
          const failureEmail = createSubscriptionRenewalFailedEmail(
            subscription.user.email,
            planType,
            message,
            retryDate,
            manageUrl
          );
          await sendEmail(failureEmail);
        } catch (emailError) {
          console.error('Failed to send renewal failure email:', emailError);
        }

        // Mark subscription as past_due if payment failed
        await prisma.premiumSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'past_due',
          },
        });
      }
    }

    // Find subscriptions that should expire (auto-renew disabled, period ended)
    const subscriptionsToExpire = await prisma.premiumSubscription.findMany({
      where: {
        status: 'active',
        autoRenew: false,
        currentPeriodEnd: {
          lte: now,
        },
      },
    });

    // Mark expired subscriptions
    for (const subscription of subscriptionsToExpire) {
      await prisma.premiumSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'expired',
        },
      });
      expired++;
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Determine job status based on results
    // - 'success' if no errors occurred
    // - 'failed' if any errors occurred (even partial failures should be flagged)
    const jobStatus = failed > 0 ? 'failed' : 'success';

    // Update job execution record
    await prisma.cronJobExecution.update({
      where: { id: execution.id },
      data: {
        status: jobStatus,
        completedAt,
        duration,
        recordsProcessed: subscriptionsToRenew.length + subscriptionsToExpire.length,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        metadata: {
          renewed,
          failed,
          expired,
          total: subscriptionsToRenew.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${subscriptionsToRenew.length} renewals, ${expired} expirations`,
      stats: {
        total: subscriptionsToRenew.length,
        renewed,
        failed,
        expired,
        duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in process-premium-renewals cron:', error);
    
    // Log failed execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-premium-renewals',
        status: 'failed',
        completedAt: new Date(),
        duration: new Date().getTime() - startedAt.getTime(),
        recordsProcessed: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to process premium renewals' },
      { status: 500 }
    );
  }
}

// Also support GET for compatibility
export async function GET(req: NextRequest) {
  return POST(req);
}
