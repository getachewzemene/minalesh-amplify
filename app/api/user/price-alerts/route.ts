import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * @swagger
 * /api/user/price-alerts:
 *   get:
 *     summary: Get user's price alerts
 *     description: Retrieve all price alerts for the authenticated user
 *     tags: [Price Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of price alerts
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/price-alerts:
 *   post:
 *     summary: Create a new price alert
 *     description: Create a new price alert for a product
 *     tags: [Price Alerts]
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
 *               - targetPrice
 *             properties:
 *               productId:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Price alert created successfully
 *       400:
 *         description: Invalid input or alert already exists
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, targetPrice } = await request.json();

    if (!productId || targetPrice === undefined || targetPrice === null) {
      return NextResponse.json(
        { error: 'Product ID and target price are required' },
        { status: 400 }
      );
    }

    if (typeof targetPrice !== 'number' || targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Target price must be a positive number' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if alert already exists for this user and product
    const existingAlert = await prisma.priceAlert.findUnique({
      where: {
        userId_productId: {
          userId: payload.userId,
          productId,
        },
      },
    });

    if (existingAlert) {
      // Update existing alert
      const updatedAlert = await prisma.priceAlert.update({
        where: { id: existingAlert.id },
        data: {
          targetPrice,
          isActive: true,
          triggered: false,
          triggeredAt: null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              salePrice: true,
              images: true,
            },
          },
        },
      });

      return NextResponse.json({
        alert: updatedAlert,
        message: 'Price alert updated successfully',
      });
    }

    // Create new alert
    const alert = await prisma.priceAlert.create({
      data: {
        userId: payload.userId,
        productId,
        targetPrice,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      alert,
      message: 'Price alert created successfully',
    });
  } catch (error) {
    console.error('Error creating price alert:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/price-alerts:
 *   delete:
 *     summary: Delete a price alert
 *     description: Delete a price alert by ID
 *     tags: [Price Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price alert ID
 *     responses:
 *       200:
 *         description: Price alert deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Price alert not found
 */
export async function DELETE(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists and belongs to user
    const alert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      );
    }

    await prisma.priceAlert.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Price alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/price-alerts:
 *   patch:
 *     summary: Update a price alert
 *     description: Update an existing price alert
 *     tags: [Price Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Price alert updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Price alert not found
 */
export async function PATCH(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, targetPrice, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists and belongs to user
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      );
    }

    const updateData: { targetPrice?: number; isActive?: boolean; triggered?: boolean; triggeredAt?: null } = {};

    if (targetPrice !== undefined) {
      if (typeof targetPrice !== 'number' || targetPrice <= 0) {
        return NextResponse.json(
          { error: 'Target price must be a positive number' },
          { status: 400 }
        );
      }
      updateData.targetPrice = targetPrice;
      // Reset triggered status when price changes
      updateData.triggered = false;
      updateData.triggeredAt = null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const alert = await prisma.priceAlert.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      alert,
      message: 'Price alert updated successfully',
    });
  } catch (error) {
    console.error('Error updating price alert:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
