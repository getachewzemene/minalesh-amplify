import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

// Valid order status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['processing', 'cancelled'],
  processing: ['fulfilled', 'cancelled'],
  fulfilled: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// PUT - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only view their own orders unless admin
    const userIsAdmin = isAdmin(payload.email);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own orders' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validNextStatuses = VALID_TRANSITIONS[order.status];
    if (!validNextStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status transition from ${order.status} to ${status}`,
          validTransitions: validNextStatuses 
        },
        { status: 400 }
      );
    }

    // Prepare timestamp field based on status
    const timestampFields: Record<string, Date> = {};
    const now = new Date();
    
    switch (status) {
      case 'paid':
        timestampFields.paidAt = now;
        break;
      case 'confirmed':
        timestampFields.confirmedAt = now;
        break;
      case 'processing':
        timestampFields.processingAt = now;
        break;
      case 'fulfilled':
        timestampFields.fulfilledAt = now;
        break;
      case 'shipped':
        timestampFields.shippedAt = now;
        break;
      case 'delivered':
        timestampFields.deliveredAt = now;
        break;
      case 'cancelled':
        timestampFields.cancelledAt = now;
        break;
      case 'refunded':
        timestampFields.refundedAt = now;
        break;
    }

    // Update order status with transaction to ensure consistency
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the order
      const updated = await tx.order.update({
        where: { id: params.orderId },
        data: {
          status,
          ...timestampFields,
        },
        include: {
          orderItems: true,
        },
      });

      // Create order event for audit trail
      await tx.orderEvent.create({
        data: {
          orderId: params.orderId,
          eventType: 'status_changed',
          status,
          description: notes || `Order status changed to ${status}`,
          metadata: {
            previousStatus: order.status,
            newStatus: status,
            changedBy: payload.userId,
            changedByEmail: payload.email,
          },
        },
      });

      return updated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating order status' },
      { status: 500 }
    );
  }
}
