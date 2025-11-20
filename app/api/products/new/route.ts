import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/products/new:
 *   get:
 *     summary: Get new products
 *     description: Retrieve recently added products
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
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Products added within the last N days
 *     responses:
 *       200:
 *         description: List of new products
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
  const days = parseInt(searchParams.get('days') || '30');

  const cacheKey = `new-products:${limit}:${categorySlug || 'all'}:${days}`;

  const products = await getOrSetCache(
    cacheKey,
    async () => {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const where: any = {
        isActive: true,
        stockQuantity: { gt: 0 },
        createdAt: { gte: dateThreshold },
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
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },
    {
      ttl: 300, // 5 minutes
      staleTime: 900, // 15 minutes stale-while-revalidate
      prefix: 'products',
      tags: ['products', 'new'],
    }
  );

  const response = NextResponse.json({ products });

  response.headers.set(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=900'
  );

  return response;
}

export const GET = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.productList)
);
