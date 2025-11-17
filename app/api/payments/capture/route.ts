import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { capturePayment, getCaptureStatus } from '@/lib/capture';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const captureSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().optional(),
  finalCapture: z.boolean().default(true),
});

// POST /api/payments/capture - Capture payment for an order
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = captureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { orderId, amount, finalCapture } = parsed.data;

    // Check if user owns the order or is admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const userIsAdmin = isAdmin(payload.role);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only capture payments for your own orders' },
        { status: 403 }
      );
    }

    // Capture payment
    const result = await capturePayment({
      orderId,
      amount,
      finalCapture,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      captureId: result.captureId,
      capturedAmount: result.capturedAmount,
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { error: 'An error occurred while capturing payment' },
      { status: 500 }
    );
  }
}

// GET /api/payments/capture?orderId=xxx - Get capture status for an order
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    // Check if user owns the order or is admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const userIsAdmin = isAdmin(payload.role);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own order capture status' },
        { status: 403 }
      );
    }

    const status = await getCaptureStatus(orderId);

    if (!status) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching capture status:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
