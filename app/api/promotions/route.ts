import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');

    const now = new Date();

    // Build where clause
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

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      promotions: promotions.map((promo) => ({
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
      })),
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching promotions' },
      { status: 500 }
    );
  }
}
