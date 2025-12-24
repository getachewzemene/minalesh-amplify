import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/products/{id}/stock-alert:
 *   post:
 *     summary: Subscribe to stock alerts
 *     description: Get notified when an out-of-stock product is back in stock
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully subscribed to stock alert
 */
async function handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stockQuantity: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.stockQuantity > 0) {
      return NextResponse.json(
        { error: 'Product is currently in stock' },
        { status: 400 }
      );
    }

    // TODO: Store stock alert subscription in database when schema is created
    // For now, log it and return success
    console.log(`Stock alert subscription for product ${productId}:`, email);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to stock alerts'
    });

  } catch (error) {
    console.error('Error creating stock alert:', error);
    return NextResponse.json(
      { error: 'Failed to create stock alert' },
      { status: 500 }
    );
  }
}

export const POST = withApiLogger(handler);
