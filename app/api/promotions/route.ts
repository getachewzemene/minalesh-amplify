import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrSetCache } from '@/lib/cache';

// Cache configuration
const PROMOTIONS_CACHE_PREFIX = 'promotions';
const PROMOTIONS_TTL = 300; // 5 minutes
const PROMOTIONS_STALE_TIME = 600; // 10 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');

    // Generate cache key based on filters
    const cacheKey = `active:${productId || 'all'}:${categoryId || 'all'}`;

    const promotions = await getOrSetCache(
      cacheKey,
      async () => {
        const now = new Date();

        // Build where clause - use any for Prisma compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
          isActive: true,
          startsAt: { lte: now },
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        };

        // Filter by product or category if provided
        if (productId) {
          whereClause.productIds = {
            path: '$',
            array_contains: productId,
          };
        }

        if (categoryId) {
          whereClause.categoryIds = {
            path: '$',
            array_contains: categoryId,
          };
        }

        const promos = await prisma.promotion.findMany({
          where: whereClause,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        return promos.map((promo) => ({
          id: promo.id,
          name: promo.name,
          description: promo.description,
          promotionType: promo.promotionType,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
          productIds: promo.productIds,
          categoryIds: promo.categoryIds,
          minimumQuantity: promo.minimumQuantity,
          minimumPurchase: promo.minimumPurchase
            ? Number(promo.minimumPurchase)
            : null,
          buyQuantity: promo.buyQuantity,
          getQuantity: promo.getQuantity,
          startsAt: promo.startsAt,
          endsAt: promo.endsAt,
        }));
      },
      {
        ttl: PROMOTIONS_TTL,
        staleTime: PROMOTIONS_STALE_TIME,
        prefix: PROMOTIONS_CACHE_PREFIX,
        tags: ['promotions'],
      }
    );

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching promotions' },
      { status: 500 }
    );
  }
}
