/**
 * Admin Subscription Statistics API
 * GET - Get subscription analytics and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getPremiumSubscriptionStats,
  getProductSubscriptionStats,
} from '@/lib/subscription';
import prisma from '@/lib/prisma';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/subscriptions/admin
 * Get comprehensive subscription statistics
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
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get stats for both subscription types
    const [premiumStats, productStats] = await Promise.all([
      getPremiumSubscriptionStats(),
      getProductSubscriptionStats(),
    ]);

    // Get recent premium subscriptions
    const recentPremium = await prisma.premiumSubscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Get recent product subscriptions
    const recentProduct = await prisma.productSubscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        product: {
          select: { name: true, slug: true },
        },
      },
    });

    // Get monthly recurring revenue estimate
    const activeMonthly = await prisma.premiumSubscription.count({
      where: { status: 'active', planType: 'premium_monthly' },
    });
    const activeYearly = await prisma.premiumSubscription.count({
      where: { status: 'active', planType: 'premium_yearly' },
    });
    
    const monthlyRecurringRevenue = (activeMonthly * 99) + (activeYearly * 999 / 12);

    return NextResponse.json({
      success: true,
      premium: {
        stats: premiumStats,
        recent: recentPremium,
      },
      productSubscriptions: {
        stats: productStats,
        recent: recentProduct,
      },
      metrics: {
        monthlyRecurringRevenue,
        totalActiveSubscribers: premiumStats.active + productStats.active,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription statistics' },
      { status: 500 }
    );
  }
}
