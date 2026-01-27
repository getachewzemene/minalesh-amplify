/**
 * Vendor Flash Sales API
 * 
 * Allows vendors to create and manage flash sales for their own products
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/vendors/flash-sales
 * Get all flash sales for the authenticated vendor's products
 */
export async function GET(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    // Check if user is a vendor
    const profile = await prisma.profile.findUnique({
      where: { userId: payload!.userId },
      select: { id: true, isVendor: true }
    });

    if (!profile?.isVendor) {
      return NextResponse.json(
        { error: 'Only vendors can access this endpoint' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    // Build where clause - only show flash sales for vendor's products
    const whereClause: any = {
      product: {
        vendorId: profile.id
      }
    };
    
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
              price: true,
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
    console.error('Error fetching vendor flash sales:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching flash sales' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors/flash-sales
 * Create a new flash sale for vendor's product
 */
export async function POST(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    // Check if user is a vendor
    const profile = await prisma.profile.findUnique({
      where: { userId: payload!.userId },
      select: { id: true, isVendor: true, vendorStatus: true }
    });

    if (!profile?.isVendor) {
      return NextResponse.json(
        { error: 'Only vendors can create flash sales' },
        { status: 403 }
      );
    }

    if (profile.vendorStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Your vendor account must be approved before creating flash sales' },
        { status: 403 }
      );
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

    // Validate discount type
    if (!['percentage', 'fixed_amount', 'free_shipping'].includes(discountType)) {
      return NextResponse.json(
        { error: 'Invalid discount type' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to vendor
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        vendorId: true,
        price: true,
        stockQuantity: true,
        isActive: true
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verify vendor owns the product
    if (product.vendorId !== profile.id) {
      return NextResponse.json(
        { error: 'You can only create flash sales for your own products' },
        { status: 403 }
      );
    }

    // Verify product is active
    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Cannot create flash sale for inactive product' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    if (end <= now) {
      return NextResponse.json(
        { error: 'End date must be in the future' },
        { status: 400 }
      );
    }

    // Validate stock limit
    if (stockLimit && stockLimit > product.stockQuantity) {
      return NextResponse.json(
        { error: `Stock limit cannot exceed available stock (${product.stockQuantity})` },
        { status: 400 }
      );
    }

    // Validate prices
    if (flashPrice >= originalPrice) {
      return NextResponse.json(
        { error: 'Flash price must be less than original price' },
        { status: 400 }
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
        startsAt: start,
        endsAt: end,
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
    console.error('Error creating vendor flash sale:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating flash sale' },
      { status: 500 }
    );
  }
}
