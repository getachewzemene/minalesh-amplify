import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createPriceDropAlertEmail } from '@/lib/email';

/**
 * GET /api/cron/process-price-alerts
 *
 * Cron job to check for price drops and send notifications to users
 *
 * Should be scheduled to run every hour or daily via Vercel Cron, GitHub Actions, or external scheduler
 *
 * Authentication: Requires CRON_SECRET header matching environment variable
 */
export async function GET(request: NextRequest) {
  const startedAt = new Date();

  try {
    // Verify cron secret
    const cronSecret =
      request.headers.get('x-cron-secret') ||
      request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.warn('CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active, non-triggered price alerts with product info
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        triggered: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
      },
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active price alerts to process',
        alertsProcessed: 0,
        notificationsSent: 0,
      });
    }

    let notificationsSent = 0;
    let alertsTriggered = 0;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';

    // Process each alert
    for (const alert of activeAlerts) {
      try {
        // Get current price (use sale price if available)
        const currentPrice = alert.product.salePrice
          ? Number(alert.product.salePrice)
          : Number(alert.product.price);
        const targetPrice = Number(alert.targetPrice);

        // Check if price has dropped to or below target
        if (currentPrice <= targetPrice) {
          // Mark as triggered
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              triggered: true,
              triggeredAt: new Date(),
            },
          });

          alertsTriggered++;

          // Send notification email
          const productUrl = `${appUrl}/product/${alert.product.slug}`;
          const originalPrice = Number(alert.product.price);
          const discount = Math.round(
            ((originalPrice - currentPrice) / originalPrice) * 100
          );

          const emailTemplate = createPriceDropAlertEmail(
            alert.user.email,
            alert.product.name,
            currentPrice,
            targetPrice,
            originalPrice,
            discount,
            productUrl,
            Array.isArray(alert.product.images) && alert.product.images.length > 0
              ? String(alert.product.images[0])
              : undefined
          );

          await sendEmail(emailTemplate);
          notificationsSent++;
        }
      } catch (alertError) {
        console.error(
          `Failed to process price alert ${alert.id}:`,
          alertError
        );
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Record cron job execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-price-alerts',
        status: 'success',
        startedAt,
        completedAt,
        duration,
        recordsProcessed: activeAlerts.length,
        metadata: {
          alertsTriggered,
          notificationsSent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Price alerts processed successfully',
      alertsProcessed: activeAlerts.length,
      alertsTriggered,
      notificationsSent,
    });
  } catch (error) {
    console.error('Error in price alerts cron:', error);

    // Record failed cron job execution
    try {
      await prisma.cronJobExecution.create({
        data: {
          jobName: 'process-price-alerts',
          status: 'failed',
          startedAt,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (recordError) {
      console.error('Failed to record cron job execution:', recordError);
    }

    return NextResponse.json(
      { error: 'Failed to process price alerts' },
      { status: 500 }
    );
  }
}
