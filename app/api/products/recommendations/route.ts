import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/products/recommendations:
 *   get:
 *     summary: Get product recommendations
 *     description: Get personalized product recommendations based on user browsing/purchase history and similar products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return (max 50)
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Get recommendations based on a specific product (similar products)
 *     responses:
 *       200:
 *         description: List of recommended products
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
  const productId = searchParams.get('productId');

  // Try to get user from token (optional - works for both authenticated and anonymous users)
  const token = getTokenFromRequest(request);
  const payload = token ? getUserFromToken(token) : null;
  const userId = payload?.userId;

  // If productId is provided, get similar products
  if (productId) {
    const cacheKey = `recommendations:product:${productId}:${limit}`;
    
    const products = await getOrSetCache(
      cacheKey,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { categoryId: true, price: true },
        });

        if (!product) {
          return [];
        }

        // Find similar products: same category, similar price range (±30%)
        const minPrice = product.price.toNumber() * 0.7;
        const maxPrice = product.price.toNumber() * 1.3;

        return await prisma.product.findMany({
          where: {
            id: { not: productId },
            categoryId: product.categoryId || undefined,
            price: {
              gte: minPrice,
              lte: maxPrice,
            },
            isActive: true,
            stockQuantity: { gt: 0 },
          },
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
            { ratingAverage: 'desc' },
            { saleCount: 'desc' },
          ],
          take: limit,
        });
      },
      {
        ttl: 600, // 10 minutes
        staleTime: 1800, // 30 minutes
        prefix: 'products',
        tags: ['products', 'recommendations'],
      }
    );

    const response = NextResponse.json({ products });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=1800'
    );
    return response;
  }

  // If user is authenticated, get personalized recommendations
  if (userId) {
    const cacheKey = `recommendations:user:${userId}:${limit}`;
    
    const products = await getOrSetCache(
      cacheKey,
      async () => {
        // Get user's order history to find purchased categories
        const orders = await prisma.order.findMany({
          where: { userId },
          include: {
            orderItems: {
              include: {
                product: {
                  select: { categoryId: true },
                },
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        // Get user's wishlist to find interested categories
        const wishlist = await prisma.wishlist.findMany({
          where: { userId },
          include: {
            product: {
              select: { categoryId: true },
            },
          },
          take: 20,
        });

        // Collect category IDs from order history and wishlist
        const categoryIds = new Set<string>();
        orders.forEach((order) => {
          order.orderItems.forEach((item) => {
            if (item.product.categoryId) {
              categoryIds.add(item.product.categoryId);
            }
          });
        });
        wishlist.forEach((item) => {
          if (item.product.categoryId) {
            categoryIds.add(item.product.categoryId);
          }
        });

        // If we have category preferences, recommend from those categories
        if (categoryIds.size > 0) {
          return await prisma.product.findMany({
            where: {
              categoryId: { in: Array.from(categoryIds) },
              isActive: true,
              stockQuantity: { gt: 0 },
            },
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
              { ratingAverage: 'desc' },
              { saleCount: 'desc' },
            ],
            take: limit,
          });
        }

        // Fallback: return popular products
        return await prisma.product.findMany({
          where: {
            isActive: true,
            stockQuantity: { gt: 0 },
          },
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
            { ratingAverage: 'desc' },
          ],
          take: limit,
        });
      },
      {
        ttl: 300, // 5 minutes
        staleTime: 900, // 15 minutes
        prefix: 'products',
        tags: ['products', 'recommendations', `user:${userId}`],
      }
    );

    const response = NextResponse.json({ products });
    response.headers.set(
      'Cache-Control',
      'private, max-age=300, stale-while-revalidate=900'
    );
    return response;
  }

  // For anonymous users, return popular products
  const cacheKey = `recommendations:anonymous:${limit}`;
  
  const products = await getOrSetCache(
    cacheKey,
    async () => {
      return await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { gt: 0 },
        },
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
          { viewCount: 'desc' },
          { ratingAverage: 'desc' },
        ],
        take: limit,
      });
    },
    {
      ttl: 600, // 10 minutes
      staleTime: 1800, // 30 minutes
      prefix: 'products',
      tags: ['products', 'recommendations'],
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
