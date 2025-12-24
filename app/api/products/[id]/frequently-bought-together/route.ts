import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/products/{id}/frequently-bought-together:
 *   get:
 *     summary: Get frequently bought together products
 *     description: Retrieve products that are frequently bought together with the specified product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of related products
 */
async function handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  try {
    // Get the current product to find similar items
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Find related products from the same category or similar price range
    const currentPriceNum = Number(currentProduct.price);
    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { stockQuantity: { gt: 0 } },
          {
            OR: [
              { categoryId: currentProduct.categoryId },
              {
                price: {
                  gte: currentPriceNum * 0.5,
                  lte: currentPriceNum * 1.5
                }
              }
            ]
          }
        ]
      },
      take: 4,
      orderBy: [
        { ratingAverage: 'desc' },
        { ratingCount: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        images: true,
        stockQuantity: true,
        ratingAverage: true,
        ratingCount: true
      }
    });

    return NextResponse.json({
      success: true,
      products: relatedProducts
    });

  } catch (error) {
    console.error('Error fetching frequently bought together:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related products' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(handler);
