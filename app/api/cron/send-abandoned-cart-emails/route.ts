import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmail, createAbandonedCartEmail } from '@/lib/email';
import { logError, logEvent } from '@/lib/logger';

/**
 * @swagger
 * /api/cron/send-abandoned-cart-emails:
 *   post:
 *     tags: [Cron, Email Marketing]
 *     summary: Send abandoned cart reminder emails
 *     description: Identifies carts abandoned for 24+ hours and sends reminder emails
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: Abandoned cart emails queued successfully
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

    // Find abandoned carts (24 hours old, not updated)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Get cart items that haven't been updated in the last 24 hours
    // but were updated within the last 48 hours (to avoid sending multiple emails)
    const abandonedCarts = await prisma.cart.findMany({
      where: {
        userId: { not: null },
        updatedAt: {
          gte: fortyEightHoursAgo,
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        variant: {
          select: {
            id: true,
            price: true,
          },
        },
      },
    });

    // Group carts by user
    const cartsByUser = new Map<string, typeof abandonedCarts>();
    for (const cart of abandonedCarts) {
      if (!cart.userId) continue;
      
      if (!cartsByUser.has(cart.userId)) {
        cartsByUser.set(cart.userId, []);
      }
      cartsByUser.get(cart.userId)!.push(cart);
    }

    let emailsSent = 0;

    // Send email for each user with abandoned cart
    for (const [userId, carts] of cartsByUser.entries()) {
      try {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId },
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
        });

        if (!user || !user.email) continue;

        // Check if user has opted in to marketing emails
        if (user.preferences && user.preferences.emailMarketing === false) {
          continue;
        }

        // Prepare cart items data
        const cartItems = carts.map(cart => ({
          name: cart.product.name,
          price: cart.variant?.price || 0,
          imageUrl: cart.product.images?.[0] || undefined,
        }));

        const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

        const userName = user.profile?.firstName || user.email.split('@')[0];
        const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/cart`;

        // Queue abandoned cart email
        await queueEmail(
          createAbandonedCartEmail(
            user.email,
            userName,
            cartItems,
            cartUrl,
            totalAmount
          )
        );

        emailsSent++;
      } catch (error) {
        logError(error, {
          operation: 'send_abandoned_cart_email',
          userId,
        });
      }
    }

    logEvent('abandoned_cart_emails_sent', {
      count: emailsSent,
      totalUsers: cartsByUser.size,
    });

    return NextResponse.json({
      success: true,
      emailsSent,
      usersProcessed: cartsByUser.size,
    });
  } catch (error) {
    logError(error, { operation: 'send_abandoned_cart_emails' });
    return NextResponse.json(
      { error: 'Failed to send abandoned cart emails' },
      { status: 500 }
    );
  }
}
