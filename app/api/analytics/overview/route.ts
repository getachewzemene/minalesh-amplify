import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/overview
 * 
 * Get comprehensive analytics overview combining key metrics
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * 
 * Returns:
 * - Key performance indicators
 * - Comparison with previous period
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime());

    // Get current period stats
    const [currentStats, prevStats] = await Promise.all([
      getOrderStats(startDate, endDate),
      getOrderStats(prevStartDate, prevEndDate),
    ]);

    // Calculate changes
    const revenueChange = calculatePercentageChange(
      currentStats.revenue,
      prevStats.revenue
    );
    const ordersChange = calculatePercentageChange(
      currentStats.orders,
      prevStats.orders
    );
    const avgOrderValueChange = calculatePercentageChange(
      currentStats.avgOrderValue,
      prevStats.avgOrderValue
    );
    const usersChange = calculatePercentageChange(
      currentStats.uniqueUsers,
      prevStats.uniqueUsers
    );

    // Get additional metrics
    const [
      totalProducts,
      activeVendors,
      totalUsers,
      totalCategories,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.profile.count({ where: { isVendor: true, vendorStatus: 'approved' } }),
      prisma.user.count(),
      prisma.category.count({ where: { isActive: true } }),
    ]);

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    });

    // Calculate conversion rate (orders / unique users who made orders)
    const conversionRate = currentStats.uniqueUsers > 0 
      ? (currentStats.orders / currentStats.uniqueUsers) * 100 
      : 0;

    return NextResponse.json({
      currentPeriod: {
        revenue: currentStats.revenue,
        orders: currentStats.orders,
        avgOrderValue: currentStats.avgOrderValue,
        uniqueUsers: currentStats.uniqueUsers,
        conversionRate,
      },
      previousPeriod: {
        revenue: prevStats.revenue,
        orders: prevStats.orders,
        avgOrderValue: prevStats.avgOrderValue,
        uniqueUsers: prevStats.uniqueUsers,
      },
      changes: {
        revenue: revenueChange,
        orders: ordersChange,
        avgOrderValue: avgOrderValueChange,
        users: usersChange,
      },
      overview: {
        totalProducts,
        activeVendors,
        totalUsers,
        totalCategories,
        avgRating: Number(avgRating._avg.rating?.toFixed(1) || 0),
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

/**
 * Get order statistics for a period
 */
async function getOrderStats(startDate: Date, endDate: Date) {
  const orderStats = await prisma.order.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        notIn: ['cancelled', 'refunded'],
      },
    },
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
    _avg: {
      totalAmount: true,
    },
  });

  const uniqueUsers = await prisma.order.groupBy({
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

  return {
    revenue: Number(orderStats._sum.totalAmount || 0),
    orders: orderStats._count.id,
    avgOrderValue: Number(orderStats._avg.totalAmount || 0),
    uniqueUsers: uniqueUsers.length,
  };
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
