import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     description: Retrieve detailed information about a specific product
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
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
async function handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required' },
      { status: 400 }
    );
  }

  const cacheKey = `product:${productId}`;

  try {
    const product = await getOrSetCache(
      cacheKey,
      async () => {
        const prod = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            vendor: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                isVendor: true,
                city: true,
                vendorStatus: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            reviews: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                  select: {
                    profile: {
                      select: {
                        displayName: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        });

        if (!prod) {
          return null;
        }

        // Increment view count
        await prisma.product.update({
          where: { id: productId },
          data: { viewCount: { increment: 1 } },
        });

        return prod;
      },
      {
        ttl: 300, // 5 minutes
        staleTime: 900, // 15 minutes stale-while-revalidate
        prefix: 'products',
        tags: ['products', `product-${productId}`],
      }
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ product });

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=900'
    );

    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the product' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.productList)
);
