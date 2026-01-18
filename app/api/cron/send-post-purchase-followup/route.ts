import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmail, createPostPurchaseFollowUpEmail } from '@/lib/email';
import { logError, logEvent } from '@/lib/logger';

// Configuration constants
const DAYS_AFTER_DELIVERY = 7;
const DAYS_AFTER_DELIVERY_WINDOW = 8; // Grace period for cron timing

/**
 * @swagger
 * /api/cron/send-post-purchase-followup:
 *   post:
 *     tags: [Cron, Email Marketing]
 *     summary: Send post-purchase follow-up emails
 *     description: Sends review request emails for orders delivered 7 days ago
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: Post-purchase follow-up emails queued successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find orders delivered exactly 7 days ago (give or take a day for cron timing)
    const sevenDaysAgo = new Date(Date.now() - DAYS_AFTER_DELIVERY * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - DAYS_AFTER_DELIVERY_WINDOW * 24 * 60 * 60 * 1000);

    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'delivered',
        updatedAt: {
          gte: eightDaysAgo,
          lte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            preferences: {
              select: {
                emailMarketing: true,
              },
            },
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    let emailsSent = 0;

    for (const order of deliveredOrders) {
      try {
        if (!order.user || !order.user.email) continue;

        // Check if user has opted in to marketing emails
        if (order.user.preferences && order.user.preferences.emailMarketing === false) {
          continue;
        }

        // Check if user already reviewed the products
        const existingReviews = await prisma.review.findMany({
          where: {
            orderId: order.id,
          },
        });

        // Skip if all products have been reviewed
        if (existingReviews.length >= order.orderItems.length) {
          continue;
        }

        const userName = order.user.profile?.firstName || order.user.email.split('@')[0];
        const products = order.orderItems.map(item => ({
          name: item.product?.name || 'Product',
          productId: item.product?.id || '',
          imageUrl: item.product?.images?.[0],
        }));

        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/orders/${order.id}/review`;

        await queueEmail(
          createPostPurchaseFollowUpEmail(
            order.user.email,
            userName,
            order.orderNumber,
            order.updatedAt,
            products,
            reviewUrl
          )
        );

        emailsSent++;
      } catch (error) {
        logError(error, {
          operation: 'send_post_purchase_followup',
          orderId: order.id,
        });
      }
    }

    logEvent('post_purchase_followup_sent', {
      count: emailsSent,
      totalOrders: deliveredOrders.length,
    });

    return NextResponse.json({
      success: true,
      emailsSent,
      ordersProcessed: deliveredOrders.length,
    });
  } catch (error) {
    logError(error, { operation: 'send_post_purchase_followup' });
    return NextResponse.json(
      { error: 'Failed to send post-purchase follow-up emails' },
      { status: 500 }
    );
  }
}
