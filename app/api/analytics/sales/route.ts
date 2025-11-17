import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, isAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/sales
 * 
 * Get sales analytics data including revenue, orders, and trends
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 * 
 * Returns:
 * - totalRevenue: Total revenue in the period
 * - totalOrders: Total number of orders
 * - averageOrderValue: Average order value
 * - trends: Array of data points with date, revenue, orders, users
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
    const groupBy = searchParams.get('groupBy') || 'day';

    // Get total stats
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

    // Get unique users count
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

    // Get trends data grouped by time period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['cancelled', 'refunded'],
        },
      },
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by date
    const trendsMap = new Map<string, { revenue: number; orders: number; userIds: Set<string> }>();
    
    orders.forEach((order) => {
      const date = formatDateForGrouping(order.createdAt, groupBy);
      
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { revenue: 0, orders: 0, userIds: new Set() });
      }
      
      const stats = trendsMap.get(date)!;
      stats.revenue += Number(order.totalAmount);
      stats.orders += 1;
      if (order.userId) {
        stats.userIds.add(order.userId);
      }
    });

    // Convert to array format
    const trends = Array.from(trendsMap.entries()).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      orders: stats.orders,
      users: stats.userIds.size,
    }));

    return NextResponse.json({
      totalRevenue: Number(orderStats._sum.totalAmount || 0),
      totalOrders: orderStats._count.id,
      averageOrderValue: Number(orderStats._avg.totalAmount || 0),
      uniqueUsers: uniqueUsers.length,
      trends,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
      },
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
}

/**
 * Format date for grouping based on groupBy parameter
 */
function formatDateForGrouping(date: Date, groupBy: string): string {
  const d = new Date(date);
  
  if (groupBy === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } else if (groupBy === 'week') {
    const weekNumber = getWeekNumber(d);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  } else {
    // day
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
