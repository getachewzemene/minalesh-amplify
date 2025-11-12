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

    const [flashSales, total] = await Promise.all([
      prisma.flashSale.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.flashSale.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      flashSales: flashSales.map((sale) => ({
        ...sale,
        discountValue: Number(sale.discountValue),
        originalPrice: Number(sale.originalPrice),
        flashPrice: Number(sale.flashPrice),
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching flash sales' },
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
      productId,
      discountType,
      discountValue,
      originalPrice,
      flashPrice,
      stockLimit,
      startsAt,
      endsAt,
    } = body;

    // Validate required fields
    if (
      !name ||
      !productId ||
      !discountType ||
      !discountValue ||
      !originalPrice ||
      !flashPrice ||
      !startsAt ||
      !endsAt
    ) {
      return NextResponse.json(
        {
          error:
            'Name, product, discount type, discount value, prices, and date range are required',
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create flash sale
    const flashSale = await prisma.flashSale.create({
      data: {
        name,
        description,
        productId,
        discountType,
        discountValue,
        originalPrice,
        flashPrice,
        stockLimit,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...flashSale,
      discountValue: Number(flashSale.discountValue),
      originalPrice: Number(flashSale.originalPrice),
      flashPrice: Number(flashSale.flashPrice),
    });
  } catch (error) {
    console.error('Error creating flash sale:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating flash sale' },
      { status: 500 }
    );
  }
}
