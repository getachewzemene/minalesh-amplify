import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';

// GET - Fetch order events (audit trail)
export async function GET(
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

    // Fetch the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const userIsAdmin = isAdmin(payload.role);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own order events' },
        { status: 403 }
      );
    }

    // Fetch order events
    const events = await prisma.orderEvent.findMany({
      where: { orderId: params.orderId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching order events:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching order events' },
      { status: 500 }
    );
  }
}

// POST - Add order event (for fulfillment, notes, etc.)
export async function POST(
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
    const { eventType, description, metadata } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Fetch the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization - only admin or order owner can add events
    const userIsAdmin = isAdmin(payload.role);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only add events to your own orders' },
        { status: 403 }
      );
    }

    // Create the event
    const event = await prisma.orderEvent.create({
      data: {
        orderId: params.orderId,
        eventType,
        status: order.status,
        description,
        metadata: {
          ...metadata,
          createdBy: payload.userId,
          createdByEmail: payload.email,
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error adding order event:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding order event' },
      { status: 500 }
    );
  }
}
