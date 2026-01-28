import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/vendors/store/{id}:
 *   get:
 *     summary: Get vendor store by vendor profile ID
 *     description: Retrieve vendor profile and all active products for a vendor store
 *     tags: [Vendors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor Profile ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         description: "Items per page (default: 20, max: 100)"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_low, price_high, rating, popular]
 *         description: "Sort order (default: newest)"
 *     responses:
 *       200:
 *         description: Vendor store details with products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vendor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     city:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     vendorStatus:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Vendor not found
 */
async function handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const vendorId = params.id;

  if (!vendorId) {
    return NextResponse.json(
      { error: 'Vendor ID is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')));
  const sortParam = searchParams.get('sort') || 'newest';

  // Build sort order
  let orderBy: { [key: string]: 'asc' | 'desc' } = { createdAt: 'desc' };
  switch (sortParam) {
    case 'price_low':
      orderBy = { price: 'asc' };
      break;
    case 'price_high':
      orderBy = { price: 'desc' };
      break;
    case 'rating':
      orderBy = { ratingAverage: 'desc' };
      break;
    case 'popular':
      orderBy = { saleCount: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const cacheKey = `vendor-store:${vendorId}:${page}:${perPage}:${sortParam}`;

  try {
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        // First, get the vendor profile
        const vendor = await prisma.profile.findUnique({
          where: { id: vendorId },
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            city: true,
            bio: true,
            avatarUrl: true,
            vendorStatus: true,
            isVendor: true,
            createdAt: true,
          },
        });

        if (!vendor || !vendor.isVendor) {
          return null;
        }

        // Get vendor's active products with pagination
        const skip = (page - 1) * perPage;
        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where: {
              vendorId,
              isActive: true,
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            orderBy,
            skip,
            take: perPage,
          }),
          prisma.product.count({
            where: {
              vendorId,
              isActive: true,
            },
          }),
        ]);

        return {
          vendor,
          products,
          pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
          },
        };
      },
      {
        ttl: 300, // 5 minutes
        staleTime: 600, // 10 minutes stale-while-revalidate
        prefix: 'vendors',
        tags: ['vendors', `vendor-store:${vendorId}`],
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(result);

    // Add cache headers for CDN and browser caching
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;
  } catch (error) {
    console.error('Error fetching vendor store:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the vendor store' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.productList)
);
