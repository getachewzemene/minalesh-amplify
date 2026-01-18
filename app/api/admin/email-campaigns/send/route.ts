import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { 
  queueEmail, 
  createFlashSaleAlertEmail,
  createProductRecommendationsEmail
} from '@/lib/email';
import { logError, logEvent } from '@/lib/logger';

// Configuration constants
const MAX_WISHLIST_ITEMS = 5;
const DEFAULT_RECOMMENDATION_LIMIT = 4;

/**
 * @swagger
 * /api/admin/email-campaigns/send:
 *   post:
 *     tags: [Admin, Email Marketing]
 *     summary: Send email campaign
 *     description: Manually send email campaigns (Flash Sale, Product Recommendations)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignType
 *             properties:
 *               campaignType:
 *                 type: string
 *                 enum: [flash_sale, product_recommendations]
 *               flashSaleData:
 *                 type: object
 *                 properties:
 *                   saleName:
 *                     type: string
 *                   discount:
 *                     type: number
 *                   endsAt:
 *                     type: string
 *                     format: date-time
 *                   saleUrl:
 *                     type: string
 *                   productIds:
 *                     type: array
 *                     items:
 *                       type: string
 *               recommendationsData:
 *                 type: object
 *                 properties:
 *                   categoryId:
 *                     type: string
 *                   limit:
 *                     type: number
 *     responses:
 *       200:
 *         description: Campaign emails queued successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = getUserFromToken(token);

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { campaignType, flashSaleData, recommendationsData } = body;

    if (!campaignType) {
      return NextResponse.json(
        { error: 'Campaign type is required' },
        { status: 400 }
      );
    }

    let emailsSent = 0;

    if (campaignType === 'flash_sale') {
      // Send Flash Sale Alert emails
      if (!flashSaleData || !flashSaleData.saleName || !flashSaleData.discount || !flashSaleData.endsAt) {
        return NextResponse.json(
          { error: 'Flash sale data is incomplete' },
          { status: 400 }
        );
      }

      const { saleName, discount, endsAt, saleUrl, productIds } = flashSaleData;

      // Get featured products for the sale
      let featuredProducts = [];
      if (productIds && productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            isPublished: true,
          },
          select: {
            name: true,
            price: true,
          },
        });

        featuredProducts = products.map(p => ({
          name: p.name,
          originalPrice: p.price,
          salePrice: p.price * (1 - discount / 100),
        }));
      }

      // Get all users who opted in to flash sale alerts
      const users = await prisma.user.findMany({
        where: {
          emailVerified: { not: null },
        },
        include: {
          profile: {
            select: {
              firstName: true,
            },
          },
          preferences: {
            select: {
              emailMarketing: true,
            },
          },
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';
      const finalSaleUrl = saleUrl || `${appUrl}/sales/${saleName.toLowerCase().replace(/\s+/g, '-')}`;

      for (const user of users) {
        // Check if user opted in
        if (user.preferences && user.preferences.emailMarketing === false) {
          continue;
        }

        const userName = user.profile?.firstName || user.email.split('@')[0];

        await queueEmail(
          createFlashSaleAlertEmail(
            user.email,
            userName,
            saleName,
            discount,
            new Date(endsAt),
            finalSaleUrl,
            featuredProducts.length > 0 ? featuredProducts : undefined
          )
        );

        emailsSent++;
      }

      logEvent('flash_sale_campaign_sent', {
        saleName,
        discount,
        emailsSent,
      });

    } else if (campaignType === 'product_recommendations') {
      // Send Product Recommendations emails based on user browsing history
      const limit = recommendationsData?.limit || DEFAULT_RECOMMENDATION_LIMIT;
      const categoryId = recommendationsData?.categoryId;

      // Get users with their recently viewed products or wishlist
      const users = await prisma.user.findMany({
        where: {
          emailVerified: { not: null },
        },
        include: {
          profile: {
            select: {
              firstName: true,
            },
          },
          preferences: {
            select: {
              emailMarketing: true,
            },
          },
          wishlists: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  categoryId: true,
                },
              },
            },
            take: MAX_WISHLIST_ITEMS,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';

      for (const user of users) {
        // Check if user opted in
        if (user.preferences && user.preferences.emailMarketing === false) {
          continue;
        }

        // Get recommendations based on wishlist or category
        let recommendations = [];
        
        // Use wishlist items to find similar products
        if (user.wishlists.length > 0) {
          const categories = user.wishlists.map(w => w.product.categoryId).filter(Boolean);
          
          const similarProducts = await prisma.product.findMany({
            where: {
              isPublished: true,
              isActive: true,
              categoryId: categoryId || (categories.length > 0 ? { in: categories as string[] } : undefined),
              id: {
                notIn: user.wishlists.map(w => w.product.id),
              },
            },
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
            },
            take: limit,
            orderBy: {
              createdAt: 'desc',
            },
          });

          recommendations = similarProducts.map(p => ({
            name: p.name,
            price: p.price,
            imageUrl: p.images?.[0],
            productUrl: `${appUrl}/products/${p.id}`,
          }));
        }

        // If not enough recommendations, get trending products
        if (recommendations.length < limit) {
          const trendingProducts = await prisma.product.findMany({
            where: {
              isPublished: true,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
            },
            take: limit - recommendations.length,
            orderBy: {
              createdAt: 'desc',
            },
          });

          const additionalRecs = trendingProducts.map(p => ({
            name: p.name,
            price: p.price,
            imageUrl: p.images?.[0],
            productUrl: `${appUrl}/products/${p.id}`,
          }));

          recommendations = [...recommendations, ...additionalRecs];
        }

        // Only send if we have recommendations
        if (recommendations.length === 0) {
          continue;
        }

        const userName = user.profile?.firstName || user.email.split('@')[0];
        const browseUrl = `${appUrl}/products`;

        await queueEmail(
          createProductRecommendationsEmail(
            user.email,
            userName,
            recommendations,
            browseUrl
          )
        );

        emailsSent++;
      }

      logEvent('product_recommendations_campaign_sent', {
        categoryId,
        emailsSent,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid campaign type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignType,
      emailsSent,
    });

  } catch (error) {
    logError(error, { operation: 'send_email_campaign' });
    return NextResponse.json(
      { error: 'Failed to send email campaign' },
      { status: 500 }
    );
  }
}
