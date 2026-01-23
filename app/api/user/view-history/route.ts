import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * @swagger
 * /api/user/view-history:
 *   get:
 *     summary: Get user's recently viewed products
 *     description: Retrieve the user's view history, sorted by most recent
 *     tags: [View History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: List of recently viewed products
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const viewHistory = await prisma.viewHistory.findMany({
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
            isActive: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: Math.min(limit, 50), // Cap at 50
    });

    // Filter out inactive products
    const activeViewHistory = viewHistory.filter(vh => vh.product.isActive);

    return NextResponse.json({ viewHistory: activeViewHistory });
  } catch (error) {
    console.error('Error fetching view history:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching view history' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/view-history:
 *   post:
 *     summary: Track a product view
 *     description: Record that the user viewed a product
 *     tags: [View History]
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
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product view tracked successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
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

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Upsert view history (update if exists, create if doesn't)
    // This updates the viewedAt timestamp for existing entries
    const viewHistory = await prisma.viewHistory.upsert({
      where: {
        userId_productId: {
          userId: payload.userId,
          productId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: payload.userId,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product view tracked successfully',
      viewHistory,
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      { error: 'An error occurred while tracking the view' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/view-history:
 *   delete:
 *     summary: Clear view history
 *     description: Delete all or specific entries from the user's view history
 *     tags: [View History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Optional product ID to remove a specific entry
 *     responses:
 *       200:
 *         description: View history cleared successfully
 *       401:
 *         description: Unauthorized
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
    const productId = searchParams.get('productId');

    if (productId) {
      // Delete specific entry
      await prisma.viewHistory.deleteMany({
        where: {
          userId: payload.userId,
          productId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'View history entry removed successfully',
      });
    } else {
      // Clear all history for user
      await prisma.viewHistory.deleteMany({
        where: {
          userId: payload.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'View history cleared successfully',
      });
    }
  } catch (error) {
    console.error('Error clearing view history:', error);
    return NextResponse.json(
      { error: 'An error occurred while clearing view history' },
      { status: 500 }
    );
  }
}
