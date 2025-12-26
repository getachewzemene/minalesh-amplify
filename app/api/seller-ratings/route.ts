import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/seller-ratings:
 *   post:
 *     summary: Submit a seller rating
 *     description: Rate a vendor after receiving an order (customers only)
 *     tags: [Seller Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - vendorId
 *               - communication
 *               - shippingSpeed
 *               - accuracy
 *               - customerService
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID
 *               vendorId:
 *                 type: string
 *                 description: Vendor Profile ID
 *               communication:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Communication rating (1-5)
 *               shippingSpeed:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Shipping speed rating (1-5)
 *               accuracy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Order accuracy rating (1-5)
 *               customerService:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Customer service rating (1-5)
 *               comment:
 *                 type: string
 *                 description: Optional comment
 *     responses:
 *       201:
 *         description: Seller rating created successfully
 *       400:
 *         description: Invalid input or duplicate rating
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *   get:
 *     summary: Get seller ratings for a vendor
 *     description: Retrieve all ratings for a specific vendor
 *     tags: [Seller Ratings]
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor Profile ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of seller ratings
 *       400:
 *         description: Vendor ID required
 */

async function createSellerRatingHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      vendorId,
      communication,
      shippingSpeed,
      accuracy,
      customerService,
      comment,
    } = body;

    // Validate required fields
    if (!orderId || !vendorId || !communication || !shippingSpeed || !accuracy || !customerService) {
      return NextResponse.json(
        { error: 'All rating fields are required' },
        { status: 400 }
      );
    }

    // Validate rating values (1-5)
    const ratings = [communication, shippingSpeed, accuracy, customerService];
    if (ratings.some((rating) => rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating values must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify the order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: { vendorId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only rate orders you placed' },
        { status: 403 }
      );
    }

    // Verify the vendor is part of this order
    const orderVendorIds = order.orderItems.map((item) => item.vendorId);
    if (!orderVendorIds.includes(vendorId)) {
      return NextResponse.json(
        { error: 'This vendor is not part of the specified order' },
        { status: 400 }
      );
    }

    // Check if rating already exists
    const existingRating = await prisma.sellerRating.findUnique({
      where: {
        orderId_userId: {
          orderId,
          userId: user.userId,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this order' },
        { status: 400 }
      );
    }

    // Calculate overall rating
    const overallRating =
      (communication + shippingSpeed + accuracy + customerService) / 4;

    // Create the rating
    const rating = await prisma.sellerRating.create({
      data: {
        userId: user.userId,
        vendorId,
        orderId,
        communication,
        shippingSpeed,
        accuracy,
        customerService,
        overallRating,
        comment,
      },
    });

    return NextResponse.json(
      {
        message: 'Seller rating submitted successfully',
        rating: {
          id: rating.id,
          overallRating: Number(rating.overallRating),
          createdAt: rating.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating seller rating:', error);
    throw error;
  }
}

async function getSellerRatingsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const [ratings, total] = await Promise.all([
      prisma.sellerRating.findMany({
        where: { vendorId },
        include: {
          user: {
            select: {
              profile: {
                select: {
                  displayName: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.sellerRating.count({ where: { vendorId } }),
    ]);

    // Calculate aggregate statistics
    const stats = await prisma.sellerRating.aggregate({
      where: { vendorId },
      _avg: {
        overallRating: true,
        communication: true,
        shippingSpeed: true,
        accuracy: true,
        customerService: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      ratings: ratings.map((rating) => ({
        id: rating.id,
        communication: rating.communication,
        shippingSpeed: rating.shippingSpeed,
        accuracy: rating.accuracy,
        customerService: rating.customerService,
        overallRating: Number(rating.overallRating),
        comment: rating.comment,
        createdAt: rating.createdAt,
        user: {
          displayName:
            rating.user.profile?.displayName ||
            rating.user.profile?.firstName ||
            'Anonymous',
        },
      })),
      statistics: {
        totalRatings: stats._count.id,
        averageOverallRating: stats._avg.overallRating
          ? Number(stats._avg.overallRating.toFixed(2))
          : 0,
        averageCommunication: stats._avg.communication
          ? Number(stats._avg.communication.toFixed(2))
          : 0,
        averageShippingSpeed: stats._avg.shippingSpeed
          ? Number(stats._avg.shippingSpeed.toFixed(2))
          : 0,
        averageAccuracy: stats._avg.accuracy
          ? Number(stats._avg.accuracy.toFixed(2))
          : 0,
        averageCustomerService: stats._avg.customerService
          ? Number(stats._avg.customerService.toFixed(2))
          : 0,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching seller ratings:', error);
    throw error;
  }
}

export const POST = withApiLogger(
  withRoleCheck(createSellerRatingHandler, ['customer', 'admin'])
);
export const GET = withApiLogger(getSellerRatingsHandler);
