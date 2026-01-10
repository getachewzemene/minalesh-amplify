/**
 * Product Subscriptions API (Subscribe & Save)
 * GET - Get user's product subscriptions
 * POST - Create new product subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getProductSubscriptions,
  createProductSubscription,
  SUBSCRIBE_SAVE_DISCOUNT,
} from '@/lib/subscription';
import { SubscriptionFrequency } from '@prisma/client';

/**
 * GET /api/subscriptions/products
 * Get all product subscriptions for current user
 */
export async function GET(req: NextRequest) {
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

    const subscriptions = await getProductSubscriptions(user.id);

    return NextResponse.json({
      success: true,
      subscriptions,
      discount: SUBSCRIBE_SAVE_DISCOUNT,
    });
  } catch (error) {
    console.error('Error fetching product subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions/products
 * Create new product subscription
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      productId,
      variantId,
      quantity = 1,
      frequency = 'monthly',
      shippingAddressId,
      deliveryInstructions,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate frequency
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

    // Validate quantity
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    const subscription = await createProductSubscription(user.id, productId, {
      variantId,
      quantity,
      frequency,
      shippingAddressId,
      deliveryInstructions,
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Product subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating product subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to create subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
