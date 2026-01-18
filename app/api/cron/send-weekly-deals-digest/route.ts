import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmail, createWeeklyDealsDigestEmail } from '@/lib/email';
import { logError, logEvent } from '@/lib/logger';

// Configuration constants
const DEFAULT_DISCOUNT_PERCENTAGE = 10;
const MIN_DEALS_COUNT = 5;
const MAX_DEALS_TO_SEND = 8;

/**
 * @swagger
 * /api/cron/send-weekly-deals-digest:
 *   post:
 *     tags: [Cron, Email Marketing]
 *     summary: Send weekly deals digest emails
 *     description: Sends weekly digest of best deals to subscribed users
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: Weekly deals digest emails queued successfully
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

    // Get top deals from active promotions
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      take: 10,
      orderBy: {
        discountValue: 'desc',
      },
    });

    // If no promotions, find products with the highest discounts
    let deals = activePromotions.map(promo => ({
      name: promo.product.name,
      category: promo.product.category?.name || 'General',
      originalPrice: promo.product.price,
      discountPrice: promo.product.price - (promo.discountValue || 0),
      discount: Math.round(((promo.discountValue || 0) / promo.product.price) * 100),
      imageUrl: promo.product.images?.[0],
      productUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/products/${promo.product.id}`,
    }));

    // If we don't have enough deals from promotions, add featured products
    if (deals.length < MIN_DEALS_COUNT) {
      const featuredProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          isActive: true,
        },
        include: {
          category: true,
        },
        take: 10 - deals.length,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const additionalDeals = featuredProducts.map(product => ({
        name: product.name,
        category: product.category?.name || 'General',
        originalPrice: product.price,
        discountPrice: product.price * (1 - DEFAULT_DISCOUNT_PERCENTAGE / 100),
        discount: DEFAULT_DISCOUNT_PERCENTAGE,
        imageUrl: product.images?.[0],
        productUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/products/${product.id}`,
      }));

      deals = [...deals, ...additionalDeals];
    }

    // Get all users who have opted in to marketing emails
    const users = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
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
      },
    });

    let emailsSent = 0;

    // Send weekly digest to all subscribed users
    for (const user of users) {
      try {
        // Check if user has opted in to marketing emails
        if (user.preferences && user.preferences.emailMarketing === false) {
          continue;
        }

        const userName = user.profile?.firstName || user.email.split('@')[0];
        const browseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et'}/deals`;

        await queueEmail(
          createWeeklyDealsDigestEmail(
            user.email,
            userName,
            deals.slice(0, MAX_DEALS_TO_SEND),
            browseUrl
          )
        );

        emailsSent++;
      } catch (error) {
        logError(error, {
          operation: 'send_weekly_deals_digest',
          userId: user.id,
        });
      }
    }

    logEvent('weekly_deals_digest_sent', {
      count: emailsSent,
      totalUsers: users.length,
      dealsCount: deals.length,
    });

    return NextResponse.json({
      success: true,
      emailsSent,
      usersProcessed: users.length,
      dealsIncluded: deals.length,
    });
  } catch (error) {
    logError(error, { operation: 'send_weekly_deals_digest' });
    return NextResponse.json(
      { error: 'Failed to send weekly deals digest' },
      { status: 500 }
    );
  }
}
