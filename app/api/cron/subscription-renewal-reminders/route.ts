/**
 * Cron Job: Subscription Renewal Reminders
 * Sends email reminders to users before their premium subscription renews
 * 
 * Runs daily to:
 * - Send 7-day reminder emails
 * - Send 3-day reminder emails
 * - Send 1-day reminder emails
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, createSubscriptionRenewalReminderEmail } from '@/lib/email';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Verify cron secret for security
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecretHeader = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true; // Allow in development
  
  return authHeader === `Bearer ${cronSecret}` || cronSecretHeader === cronSecret;
}

// Days before renewal to send reminders
const REMINDER_DAYS: readonly number[] = [7, 3, 1] as const;

/**
 * GET /api/cron/subscription-renewal-reminders
 * Process subscription renewal reminders
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date();
  let remindersSent = 0;
  let processed = 0;
  const errors: string[] = [];

  try {
    // Log job start
    const execution = await prisma.cronJobExecution.create({
      data: {
        jobName: 'subscription-renewal-reminders',
        status: 'running',
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';
    const manageUrl = `${appUrl}/subscriptions`;

    // Process each reminder day
    for (const daysUntilRenewal of REMINDER_DAYS) {
      const targetDate = addDays(new Date(), daysUntilRenewal);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      // Find subscriptions that will renew on this target date
      const subscriptions = await prisma.premiumSubscription.findMany({
        where: {
          status: 'active',
          autoRenew: true,
          currentPeriodEnd: {
            gte: dayStart,
            lte: dayEnd,
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

      console.log(`Found ${subscriptions.length} subscriptions renewing in ${daysUntilRenewal} days`);

      for (const subscription of subscriptions) {
        processed++;
        try {
          // Create and send reminder email
          const planType = subscription.planType as 'premium_monthly' | 'premium_yearly';
          const emailTemplate = createSubscriptionRenewalReminderEmail(
            subscription.user.email,
            planType,
            subscription.currentPeriodEnd,
            Number(subscription.priceAmount),
            daysUntilRenewal,
            manageUrl
          );

          await sendEmail(emailTemplate);
          remindersSent++;

          console.log(`Sent ${daysUntilRenewal}-day renewal reminder to ${subscription.user.email}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Subscription ${subscription.id}: ${message}`);
          console.error(`Failed to send reminder for subscription ${subscription.id}:`, error);
        }
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Determine job status based on results
    // - 'success' if no errors occurred
    // - 'failed' if any errors occurred (even partial failures should be flagged)
    const jobStatus = errors.length > 0 ? 'failed' : 'success';

    // Update job execution record
    await prisma.cronJobExecution.update({
      where: { id: execution.id },
      data: {
        status: jobStatus,
        completedAt,
        duration,
        recordsProcessed: processed,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        metadata: {
          remindersSent,
          processed,
          failed: errors.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} renewal reminders`,
      stats: {
        processed,
        remindersSent,
        failed: errors.length,
        duration,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in subscription-renewal-reminders cron:', error);
    
    // Log failed execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'subscription-renewal-reminders',
        status: 'failed',
        completedAt: new Date(),
        duration: new Date().getTime() - startedAt.getTime(),
        recordsProcessed: processed,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to process renewal reminders' },
      { status: 500 }
    );
  }
}

// Also support POST for compatibility with different cron job services
export async function POST(req: NextRequest) {
  return GET(req);
}
