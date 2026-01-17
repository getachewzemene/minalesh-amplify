/**
 * Premium Subscription API
 * GET - Get current user's premium subscription
 * POST - Create new premium subscription
 * PUT - Update premium subscription (pause/resume/cancel)
 * DELETE - Cancel premium subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getPremiumSubscription,
  createPremiumSubscription,
  cancelPremiumSubscription,
  pausePremiumSubscription,
  resumePremiumSubscription,
  hasActivePremiumSubscription,
  PREMIUM_PRICING,
  PREMIUM_BENEFITS,
} from '@/lib/subscription';
import { SubscriptionPlanType } from '@prisma/client';

/**
 * GET /api/subscriptions/premium
 * Get current user's premium subscription status and details
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

    const subscription = await getPremiumSubscription(user.userId);
    const isActive = await hasActivePremiumSubscription(user.userId);

    return NextResponse.json({
      success: true,
      subscription,
      isActive,
      pricing: PREMIUM_PRICING,
      benefits: PREMIUM_BENEFITS,
    });
  } catch (error) {
    console.error('Error fetching premium subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions/premium
 * Create new premium subscription
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

    // Check if already has subscription
    const existing = await getPremiumSubscription(user.userId);
    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { planType = 'premium_monthly', paymentMethod } = body;

    // Validate plan type
    if (!['premium_monthly', 'premium_yearly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const subscription = await createPremiumSubscription(
      user.id,
      planType as SubscriptionPlanType,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Premium subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating premium subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscriptions/premium
 * Update premium subscription (pause, resume, update payment method)
 */
export async function PUT(req: NextRequest) {
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
    const { action, resumeDate } = body;

    let subscription;

    switch (action) {
      case 'pause':
        subscription = await pausePremiumSubscription(
          user.id,
          resumeDate ? new Date(resumeDate) : undefined
        );
        break;
      case 'resume':
        subscription = await resumePremiumSubscription(user.userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: `Subscription ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error updating premium subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to update subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/premium
 * Cancel premium subscription
 */
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const immediate = searchParams.get('immediate') === 'true';

    const subscription = await cancelPremiumSubscription(user.userId, immediate);

    return NextResponse.json({
      success: true,
      subscription,
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
    });
  } catch (error) {
    console.error('Error cancelling premium subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
