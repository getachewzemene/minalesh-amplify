import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import {
  initiateRefund,
  processRefund,
  getOrderRefunds,
  getRefundableAmount,
} from '@/lib/refund';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const refundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  restoreStock: z.boolean().default(true),
});

// POST /api/refunds - Initiate a refund
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = refundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { orderId, amount, reason, restoreStock } = parsed.data;

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
        { error: 'Forbidden - You can only refund your own orders' },
        { status: 403 }
      );
    }

    // Initiate refund
    const result = await initiateRefund({
      orderId,
      amount,
      reason,
      restoreStock,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Process refund immediately (in production, this might be queued)
    if (result.refundId) {
      await processRefund(result.refundId);
    }

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/refunds?orderId=xxx - Get refunds for an order
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
        { error: 'Forbidden - You can only view your own order refunds' },
        { status: 403 }
      );
    }

    const refunds = await getOrderRefunds(orderId);
    const refundableAmount = await getRefundableAmount(orderId);

    return NextResponse.json({
      refunds,
      refundableAmount,
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
