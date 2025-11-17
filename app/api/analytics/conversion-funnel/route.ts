import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, isAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/conversion-funnel
 * 
 * Get conversion funnel analytics
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * 
 * Returns conversion funnel stages:
 * - Product Views (from product views or approximated from orders)
 * - Add to Cart (from cart items or orders)
 * - Checkout Started (from orders created)
 * - Payment Info (from orders with payment status)
 * - Order Complete (from completed orders)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !isAdmin(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get unique users count (total visits approximation)
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          lte: endDate,
        },
      },
    });

    // Get product views (approximate from wishlist and orders)
    const wishlistCount = await prisma.wishlist.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get orders as proxy for product views (multiply by factor for estimation)
    const allOrdersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Estimate product views (wishlist + orders * 10 as conservative estimate)
    const productViews = Math.max(wishlistCount + (allOrdersCount * 10), totalUsers);

    // Get unique users who added to cart (approximated from orders)
    const uniqueCartUsers = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        userId: {
          not: null,
        },
      },
    });

    const addToCartCount = uniqueCartUsers.length;

    // Get checkout started (all orders created)
    const checkoutStartedCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get payment info entered (orders with payment method)
    const paymentInfoCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentMethod: {
          not: null,
        },
      },
    });

    // Get completed orders
    const orderCompleteCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['paid', 'confirmed', 'processing', 'fulfilled', 'shipped', 'delivered'],
        },
      },
    });

    // Build funnel data
    const funnelData = [
      {
        stage: 'Product Views',
        value: productViews,
        rate: 100,
        dropOff: 0,
      },
      {
        stage: 'Add to Cart',
        value: addToCartCount,
        rate: productViews > 0 ? (addToCartCount / productViews) * 100 : 0,
        dropOff: productViews > 0 ? ((productViews - addToCartCount) / productViews) * 100 : 0,
      },
      {
        stage: 'Checkout Started',
        value: checkoutStartedCount,
        rate: addToCartCount > 0 ? (checkoutStartedCount / addToCartCount) * 100 : 0,
        dropOff: addToCartCount > 0 ? ((addToCartCount - checkoutStartedCount) / addToCartCount) * 100 : 0,
      },
      {
        stage: 'Payment Info',
        value: paymentInfoCount,
        rate: checkoutStartedCount > 0 ? (paymentInfoCount / checkoutStartedCount) * 100 : 0,
        dropOff: checkoutStartedCount > 0 ? ((checkoutStartedCount - paymentInfoCount) / checkoutStartedCount) * 100 : 0,
      },
      {
        stage: 'Order Complete',
        value: orderCompleteCount,
        rate: paymentInfoCount > 0 ? (orderCompleteCount / paymentInfoCount) * 100 : 0,
        dropOff: paymentInfoCount > 0 ? ((paymentInfoCount - orderCompleteCount) / paymentInfoCount) * 100 : 0,
      },
    ];

    // Calculate overall conversion rate
    const overallConversionRate = productViews > 0 
      ? (orderCompleteCount / productViews) * 100 
      : 0;

    return NextResponse.json({
      funnel: funnelData,
      overallConversionRate,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      note: 'Product Views are estimated based on wishlist activity and order patterns. For more accurate tracking, implement client-side analytics.',
    });
  } catch (error) {
    console.error('Error fetching conversion funnel analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion funnel analytics' },
      { status: 500 }
    );
  }
}
