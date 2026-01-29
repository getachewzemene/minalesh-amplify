import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { getOrSetCache, invalidateCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

// Cache configuration
const REVIEWS_CACHE_PREFIX = 'reviews';
const REVIEWS_TTL = 300; // 5 minutes
const REVIEWS_STALE_TIME = 600; // 10 minutes

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get product reviews
 *     description: Retrieve all approved reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of reviews
 *       400:
 *         description: Product ID required
 */
async function getHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    const cacheKey = `product:${productId}`;
    
    const reviews = await getOrSetCache(
      cacheKey,
      async () => {
        return await prisma.review.findMany({
          where: {
            productId,
            isApproved: true,
          },
          include: {
            user: {
              select: {
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      {
        ttl: REVIEWS_TTL,
        staleTime: REVIEWS_STALE_TIME,
        prefix: REVIEWS_CACHE_PREFIX,
        tags: ['reviews', `product:${productId}`],
      }
    );

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(
  withRateLimit(getHandler, RATE_LIMIT_CONFIGS.productList)
);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     description: Submit a review for a product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
async function postHandler(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, rating, title, comment } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json(
        { error: 'Product ID and rating are required' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: payload.userId,
        productId,
        rating,
        title,
        comment,
      },
    });

    // Invalidate reviews cache for this product
    await invalidateCache(`product:${productId}`, { prefix: REVIEWS_CACHE_PREFIX });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// Moderate rate limit for reviews - prevent spam
export const POST = withApiLogger(
  withRateLimit(postHandler, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // Max 5 reviews per hour
  })
);
