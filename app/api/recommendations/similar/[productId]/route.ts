import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/recommendations/similar/[productId]
 * 
 * Get similar products based on category, price range, and features
 * Public endpoint - no authentication required
 * 
 * Query params:
 * - limit: Number of recommendations (default: 8, max: 20)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

    // Get the source product
    const sourceProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!sourceProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate price range (±30%)
    const priceNum = parseFloat(sourceProduct.price.toString());
    const minPrice = priceNum * 0.7;
    const maxPrice = priceNum * 1.3;

    // Find similar products
    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        stockQuantity: { gt: 0 },
        OR: [
          {
            // Same category
            categoryId: sourceProduct.categoryId,
          },
          {
            // Similar price range
            price: {
              gte: minPrice,
              lte: maxPrice,
            },
          },
          {
            // Same brand
            brand: sourceProduct.brand,
          },
        ],
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

    // Score and rank similarity
    const scoredProducts = similarProducts.map(product => {
      let similarityScore = 0;

      // Category match (highest weight)
      if (product.categoryId === sourceProduct.categoryId) {
        similarityScore += 0.5;
      }

      // Price similarity
      const productPrice = parseFloat(product.price.toString());
      const priceDiff = Math.abs(productPrice - priceNum) / priceNum;
      similarityScore += (1 - priceDiff) * 0.3;

      // Brand match
      if (product.brand === sourceProduct.brand && sourceProduct.brand) {
        similarityScore += 0.2;
      }

      return {
        ...product,
        similarityScore,
      };
    });

    // Sort by similarity score and limit
    const topSimilar = scoredProducts
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: topSimilar,
      metadata: {
        count: topSimilar.length,
        sourceProduct: {
          id: sourceProduct.id,
          name: sourceProduct.name,
          categoryId: sourceProduct.categoryId,
        },
      },
    });
  } catch (error) {
    console.error('Error finding similar products:', error);
    return NextResponse.json(
      { error: 'Failed to find similar products' },
      { status: 500 }
    );
  }
}
