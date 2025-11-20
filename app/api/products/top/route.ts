import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/products/top:
 *   get:
 *     summary: Get top products
 *     description: Retrieve top-selling and most popular products based on sales count and views
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return (max 50)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *     responses:
 *       200:
 *         description: List of top products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const categorySlug = searchParams.get('category');

  const cacheKey = `top-products:${limit}:${categorySlug || 'all'}`;

  const products = await getOrSetCache(
    cacheKey,
    async () => {
      const where: any = {
        isActive: true,
        stockQuantity: { gt: 0 },
      };

      if (categorySlug) {
        where.category = { slug: categorySlug };
      }

      return await prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              isVendor: true,
              city: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { saleCount: 'desc' },
          { viewCount: 'desc' },
          { ratingAverage: 'desc' },
        ],
        take: limit,
      });
    },
    {
      ttl: 600, // 10 minutes
      staleTime: 1800, // 30 minutes stale-while-revalidate
      prefix: 'products',
      tags: ['products', 'top'],
    }
  );

  const response = NextResponse.json({ products });

  response.headers.set(
    'Cache-Control',
    'public, s-maxage=600, stale-while-revalidate=1800'
  );

  return response;
}

export const GET = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.productList)
);
