import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { withRole } from '@/lib/middleware';
import { validateStatusTransition } from '@/lib/order-status';
import { sendTrackingNotification } from '@/lib/logistics';
import type { OrderStatus } from '@prisma/client';

// PUT - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const internalSecret = request.headers.get('x-internal-secret') || '';
    const internalAuthorized = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;

  const token = internalAuthorized ? null : getTokenFromRequest(request);
  const payload = internalAuthorized ? ({ userId: 'system', email: 'system@internal', role: 'admin' as const }) : getUserFromToken(token);

    if (!payload && !internalAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    // Enhanced order statuses including new tracking stages
    const allowedStatuses = [
      'pending', 'paid', 'confirmed', 'processing',
      'packed', 'picked_up', 'in_transit', 'out_for_delivery',
      'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'
    ] as const;
    if (!status || !allowedStatuses.includes(status)) {
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
    const userIsAdmin = internalAuthorized ? true : isAdmin(payload.role);
    if (!internalAuthorized && !userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own orders' },
        { status: 403 }
      );
    }

    // Validate status transition using centralized validator
    const validation = validateStatusTransition(order.status as OrderStatus, status as OrderStatus);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
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
      case 'packed':
        timestampFields.packedAt = now;
        break;
      case 'picked_up':
        timestampFields.pickedUpAt = now;
        break;
      case 'in_transit':
        timestampFields.inTransitAt = now;
        break;
      case 'out_for_delivery':
        timestampFields.outForDeliveryAt = now;
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

      // Create order event for audit trail (raw to avoid client type mismatch)
      await tx.$executeRawUnsafe(
        'INSERT INTO "order_events" (order_id, event_type, status, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        params.orderId,
        'status_changed',
        (status as unknown as string),
        notes || `Order status changed to ${status}`,
        JSON.stringify({
          previousStatus: order.status,
          newStatus: status,
          changedBy: payload.userId,
          changedByEmail: payload.email,
        })
      );

      return updated;
    });

    // Send SMS notification for tracking-related status changes
    // Map order status to SMS notification stages
    const smsStageMapping: Record<string, string> = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'packed': 'packed',
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
    };

    const smsStage = smsStageMapping[status];
    if (smsStage) {
      // Send SMS notification asynchronously (don't wait for it)
      sendTrackingNotification(params.orderId, smsStage).catch((error) => {
        console.error('Failed to send SMS notification:', error);
        // Log error but don't fail the status update
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating order status' },
      { status: 500 }
    );
  }
}
