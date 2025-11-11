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

    if (!payload || !isAdmin(payload.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.coupon.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      coupons: coupons.map((coupon) => ({
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minimumPurchase: coupon.minimumPurchase
          ? Number(coupon.minimumPurchase)
          : null,
        maximumDiscount: coupon.maximumDiscount
          ? Number(coupon.maximumDiscount)
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
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload || !isAdmin(payload.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
    } = body;

    // Validate required fields
    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minimumPurchase,
        maximumDiscount,
        usageLimit,
        perUserLimit,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return NextResponse.json({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase
        ? Number(coupon.minimumPurchase)
        : null,
      maximumDiscount: coupon.maximumDiscount
        ? Number(coupon.maximumDiscount)
        : null,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating coupon' },
      { status: 500 }
    );
  }
}
