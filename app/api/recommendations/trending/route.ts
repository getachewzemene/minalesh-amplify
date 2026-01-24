import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Trending score weights
const TRENDING_WEIGHTS = {
  VIEW_COUNT: 0.3,
  SALE_COUNT: 0.5,
  RECENT_REVIEWS: 0.2,
} as const;

/**
 * GET /api/recommendations/trending
 * 
 * Get trending products based on recent activity
 * Public endpoint - no authentication required
 * 
 * Query params:
 * - limit: Number of products (default: 20, max: 50)
 * - days: Number of days to look back (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const days = parseInt(searchParams.get('days') || '7');

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get products with high activity in the specified period
    const trendingProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
        updatedAt: { gte: dateThreshold },
      },
      include: {
        category: true,
        reviews: {
          where: {
            createdAt: { gte: dateThreshold },
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { saleCount: 'desc' },
        { ratingAverage: 'desc' },
      ],
      take: limit,
    });

    // Calculate trending score
    const scoredProducts = trendingProducts.map(product => {
      const recentReviews = product.reviews.length;
      const trendingScore = 
        (product.viewCount * TRENDING_WEIGHTS.VIEW_COUNT) +
        (product.saleCount * TRENDING_WEIGHTS.SALE_COUNT) +
        (recentReviews * TRENDING_WEIGHTS.RECENT_REVIEWS);

      return {
        ...product,
        trendingScore,
      };
    });

    // Sort by trending score
    const sortedProducts = scoredProducts
      .sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json({
      success: true,
      data: sortedProducts,
      metadata: {
        count: sortedProducts.length,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending products' },
      { status: 500 }
    );
  }
}
