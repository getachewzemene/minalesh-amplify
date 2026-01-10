/**
 * Individual Product Subscription API
 * GET - Get specific subscription details
 * PUT - Update subscription (pause, resume, update, skip)
 * DELETE - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  updateProductSubscription,
  cancelProductSubscription,
  pauseProductSubscription,
  resumeProductSubscription,
  skipNextDelivery,
} from '@/lib/subscription';
import { SubscriptionFrequency } from '@prisma/client';

/**
 * GET /api/subscriptions/products/[id]
 * Get specific product subscription details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    const subscription = await prisma.productSubscription.findFirst({
      where: { id, userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            images: true,
            stockQuantity: true,
            vendor: {
              select: {
                displayName: true,
              },
            },
          },
        },
        variant: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: {
              select: {
                orderNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Error fetching product subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscriptions/products/[id]
 * Update product subscription
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, quantity, frequency, shippingAddressId, deliveryInstructions, resumeDate } = body;

    let subscription;

    switch (action) {
      case 'pause':
        subscription = await pauseProductSubscription(
          id,
          user.id,
          resumeDate ? new Date(resumeDate) : undefined
        );
        break;

      case 'resume':
        subscription = await resumeProductSubscription(id, user.id);
        break;

      case 'skip':
        subscription = await skipNextDelivery(id, user.id);
        break;

      case 'update':
        // Validate updates
        if (quantity !== undefined && (quantity < 1 || quantity > 100)) {
          return NextResponse.json(
            { error: 'Quantity must be between 1 and 100' },
            { status: 400 }
          );
        }

        if (frequency) {
          const validFrequencies: SubscriptionFrequency[] = [
            'weekly',
            'biweekly',
            'monthly',
            'bimonthly',
            'quarterly',
          ];
          if (!validFrequencies.includes(frequency)) {
            return NextResponse.json(
              { error: 'Invalid subscription frequency' },
              { status: 400 }
            );
          }
        }

        subscription = await updateProductSubscription(id, user.id, {
          quantity,
          frequency,
          shippingAddressId,
          deliveryInstructions,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, skip, or update' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: `Subscription ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error updating product subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to update subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/products/[id]
 * Cancel product subscription
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || undefined;

    const subscription = await cancelProductSubscription(id, user.id, reason);

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling product subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
