import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/src/lib/auth';

const prisma = new PrismaClient();

/**
 * Helper function to extract unique category IDs from user interactions
 */
function extractCategoryIds(
  userOrders: any[],
  viewHistory: any[],
  wishlist: any[]
): Set<string> {
  const categoryIds = new Set<string>();

  // From purchase history
  userOrders.forEach(order => {
    order.orderItems.forEach((item: any) => {
      if (item.product.categoryId) {
        categoryIds.add(item.product.categoryId);
      }
    });
  });

  // From view history
  viewHistory.forEach(vh => {
    if (vh.product.categoryId) {
      categoryIds.add(vh.product.categoryId);
    }
  });

  // From wishlist
  wishlist.forEach(w => {
    if (w.product.categoryId) {
      categoryIds.add(w.product.categoryId);
    }
  });

  return categoryIds;
}

/**
 * GET /api/recommendations/personalized
 * 
 * Get personalized product recommendations for the authenticated user
 * Uses hybrid recommendation algorithm (collaborative + content-based filtering)
 * 
 * Query params:
 * - limit: Number of recommendations (default: 12, max: 50)
 * - algorithm: collaborative | content_based | trending | hybrid (default: hybrid)
 * 
 * Returns array of recommended products with recommendation scores
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const algorithm = searchParams.get('algorithm') || 'hybrid';

    // Get user's purchase history
    const userOrders = await prisma.order.findMany({
      where: {
        userId,
        paymentStatus: 'completed',
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Get user's view history
    const viewHistory = await prisma.viewHistory.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });

    // Get user's wishlist
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
    });

    // Extract product IDs and categories from user interaction
    const purchasedProductIds = new Set(
      userOrders.flatMap(order => 
        order.orderItems.map(item => item.productId)
      )
    );

    const viewedProductIds = new Set(
      viewHistory.map(vh => vh.productId)
    );

    const wishlistProductIds = new Set(
      wishlist.map(w => w.productId)
    );

    // Extract category IDs using helper function
    const interactedCategoryIds = extractCategoryIds(userOrders, viewHistory, wishlist);

    let recommendations: any[] = [];

    if (algorithm === 'collaborative' || algorithm === 'hybrid') {
      // Collaborative filtering: Find similar users and their purchases
      const similarUserPurchases = await prisma.order.findMany({
        where: {
          userId: { not: userId },
          paymentStatus: 'completed',
          orderItems: {
            some: {
              productId: {
                in: Array.from(purchasedProductIds),
              },
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                  reviews: {
                    select: {
                      rating: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 100,
      });

      // Extract products bought by similar users
      const collaborativeProducts = similarUserPurchases
        .flatMap(order => order.orderItems)
        .filter(item => 
          !purchasedProductIds.has(item.productId) &&
          item.product.isActive &&
          item.product.stockQuantity > 0
        )
        .map(item => ({
          ...item.product,
          recommendationScore: 0.8, // High confidence for collaborative
          algorithm: 'collaborative' as const,
        }));

      recommendations = [...recommendations, ...collaborativeProducts];
    }

    if (algorithm === 'content_based' || algorithm === 'hybrid') {
      // Content-based filtering: Products from similar categories
      const contentBasedProducts = await prisma.product.findMany({
        where: {
          categoryId: {
            in: Array.from(interactedCategoryIds) as string[],
          },
          isActive: true,
          stockQuantity: { gt: 0 },
          id: {
            notIn: [
              ...Array.from(purchasedProductIds),
              ...Array.from(wishlistProductIds),
            ],
          },
        },
        include: {
          category: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [
          { ratingAverage: 'desc' },
          { saleCount: 'desc' },
        ],
        take: limit * 2,
      });

      const contentRecommendations = contentBasedProducts.map(product => ({
        ...product,
        recommendationScore: 0.6, // Medium confidence for content-based
        algorithm: 'content_based' as const,
      }));

      recommendations = [...recommendations, ...contentRecommendations];
    }

    if (algorithm === 'trending' || algorithm === 'hybrid') {
      // Trending products: High sales and views in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trendingProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { gt: 0 },
          updatedAt: { gte: sevenDaysAgo },
          id: {
            notIn: Array.from(purchasedProductIds),
          },
        },
        include: {
          category: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { saleCount: 'desc' },
        ],
        take: limit,
      });

      const trendingRecommendations = trendingProducts.map(product => ({
        ...product,
        recommendationScore: 0.7,
        algorithm: 'trending' as const,
      }));

      recommendations = [...recommendations, ...trendingRecommendations];
    }

    // Remove duplicates and sort by recommendation score
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(item => [item.id, item])).values()
    )
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    // Store recommendation scores in database for analytics (batched)
    // Limit to prevent performance issues with large datasets
    const MAX_SCORES_TO_STORE = 50;
    const scorestoStore = uniqueRecommendations.slice(0, MAX_SCORES_TO_STORE);
    
    if (scorestoStore.length > 0) {
      try {
        await prisma.recommendationScore.createMany({
          data: scorestoStore.map(rec => ({
            userId,
            productId: rec.id,
            score: rec.recommendationScore,
            algorithm: rec.algorithm,
            factors: {
              categories: Array.from(interactedCategoryIds),
              purchaseHistory: Array.from(purchasedProductIds).slice(0, 10),
              viewHistory: Array.from(viewedProductIds).slice(0, 10),
            },
          })),
          skipDuplicates: true,
        });
      } catch (error) {
        // Log error but don't fail the request
        console.error('Error storing recommendation scores:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: uniqueRecommendations,
      metadata: {
        count: uniqueRecommendations.length,
        algorithm,
        userId,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
