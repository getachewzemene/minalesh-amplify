import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/src/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/social/group-purchase/create
 * 
 * Create a new group purchase for a product
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const body = await request.json();
    
    const {
      productId,
      title,
      description,
      requiredMembers,
      maxMembers,
      pricePerPerson,
      regularPrice,
      expiresInHours = 24,
    } = body;

    // Validate required fields
    if (!productId || !title || !requiredMembers || !pricePerPerson || !regularPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.isActive || product.stockQuantity < requiredMembers) {
      return NextResponse.json(
        { error: 'Product is not available for group purchase' },
        { status: 400 }
      );
    }

    // Calculate discount percentage
    const discount = ((regularPrice - pricePerPerson) / regularPrice) * 100;

    // Set expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create group purchase
    const groupPurchase = await prisma.groupPurchase.create({
      data: {
        productId,
        initiatorId: userId,
        title,
        description,
        requiredMembers,
        maxMembers,
        pricePerPerson,
        regularPrice,
        discount,
        expiresAt,
        currentMembers: 1,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Add initiator as first member
    await prisma.groupPurchaseMember.create({
      data: {
        groupPurchaseId: groupPurchase.id,
        userId,
        isPaid: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: groupPurchase,
      message: 'Group purchase created successfully',
    });
  } catch (error) {
    console.error('Error creating group purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create group purchase' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/group-purchase/create
 * 
 * Get active group purchases
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const productId = searchParams.get('productId');

    const where: any = {
      status: 'active',
      expiresAt: { gt: new Date() },
    };

    if (productId) {
      where.productId = productId;
    }

    const groupPurchases = await prisma.groupPurchase.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        initiator: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        members: {
          select: {
            id: true,
            userId: true,
            isPaid: true,
            joinedAt: true,
          },
        },
      },
      orderBy: [
        { currentMembers: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: groupPurchases,
      metadata: {
        count: groupPurchases.length,
      },
    });
  } catch (error) {
    console.error('Error fetching group purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group purchases' },
      { status: 500 }
    );
  }
}
