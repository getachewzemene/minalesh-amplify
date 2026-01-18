import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmail, createReEngagementEmail } from '@/lib/email';
import { logError, logEvent } from '@/lib/logger';

// Configuration constants
const MIN_INACTIVE_DAYS = 30;
const MAX_INACTIVE_DAYS = 60;

/**
 * @swagger
 * /api/cron/send-reengagement-emails:
 *   post:
 *     tags: [Cron, Email Marketing]
 *     summary: Send re-engagement emails to inactive users
 *     description: Sends re-engagement emails to users inactive for 30+ days
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: Re-engagement emails queued successfully
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

    // Find users who haven't placed an order in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - MIN_INACTIVE_DAYS * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - MAX_INACTIVE_DAYS * 24 * 60 * 60 * 1000);

    // Get users with their last order
    const users = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        createdAt: { lte: thirtyDaysAgo },
      },
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
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // Get active promotions for special offers
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      include: {
        product: true,
      },
      take: 3,
      orderBy: {
        discountValue: 'desc',
      },
    });

    const specialOffers = activePromotions.map(promo => ({
      title: `${promo.name || 'Special Deal'}`,
      description: promo.description || `Get ${promo.discountValue} ETB off on ${promo.product.name}`,
      discount: Math.round(((promo.discountValue || 0) / promo.product.price) * 100),
      offerUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/products/${promo.product.id}`,
    }));

    // Add default offers if not enough promotions
    while (specialOffers.length < 3) {
      specialOffers.push({
        title: 'Welcome Back Discount',
        description: 'Get 15% off your next order',
        discount: 15,
        offerUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/deals`,
      });
    }

    let emailsSent = 0;

    for (const user of users) {
      try {
        // Check if user has opted in to marketing emails
        if (user.preferences && user.preferences.emailMarketing === false) {
          continue;
        }

        // Check if user has any orders
        const lastOrder = user.orders[0];
        
        // Skip if user has ordered recently (within 30 days)
        if (lastOrder && lastOrder.createdAt > thirtyDaysAgo) {
          continue;
        }

        // Calculate days since last activity (order or account creation)
        const lastActivity = lastOrder ? lastOrder.createdAt : user.createdAt;
        const daysSinceLastVisit = Math.floor(
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send to users inactive for 30-60 days to avoid spam
        if (daysSinceLastVisit < MIN_INACTIVE_DAYS || daysSinceLastVisit > MAX_INACTIVE_DAYS) {
          continue;
        }

        const userName = user.profile?.firstName || user.email.split('@')[0];
        const exploreUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/products`;
        const accountUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/account/preferences`;

        await queueEmail(
          createReEngagementEmail(
            user.email,
            userName,
            daysSinceLastVisit,
            specialOffers,
            exploreUrl,
            accountUrl
          )
        );

        emailsSent++;
      } catch (error) {
        logError(error, {
          operation: 'send_reengagement_email',
          userId: user.id,
        });
      }
    }

    logEvent('reengagement_emails_sent', {
      count: emailsSent,
      totalUsers: users.length,
    });

    return NextResponse.json({
      success: true,
      emailsSent,
      usersProcessed: users.length,
    });
  } catch (error) {
    logError(error, { operation: 'send_reengagement_emails' });
    return NextResponse.json(
      { error: 'Failed to send re-engagement emails' },
      { status: 500 }
    );
  }
}
