import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const whereClause: any = {};
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where: whereClause,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.promotion.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      promotions: promotions.map((promo) => ({
        ...promo,
        discountValue: Number(promo.discountValue),
        minimumPurchase: promo.minimumPurchase
          ? Number(promo.minimumPurchase)
          : null,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching promotions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      promotionType,
      discountType,
      discountValue,
      productIds,
      categoryIds,
      minimumQuantity,
      minimumPurchase,
      buyQuantity,
      getQuantity,
      startsAt,
      endsAt,
      priority,
    } = body;

    // Validate required fields
    if (!name || !promotionType || !discountType || !discountValue || !startsAt) {
      return NextResponse.json(
        {
          error:
            'Name, promotion type, discount type, discount value, and start date are required',
        },
        { status: 400 }
      );
    }

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        promotionType,
        discountType,
        discountValue,
        productIds: productIds || [],
        categoryIds: categoryIds || [],
        minimumQuantity,
        minimumPurchase,
        buyQuantity,
        getQuantity,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        priority: priority || 0,
      },
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
      minimumPurchase: promotion.minimumPurchase
        ? Number(promotion.minimumPurchase)
        : null,
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating promotion' },
      { status: 500 }
    );
  }
}
