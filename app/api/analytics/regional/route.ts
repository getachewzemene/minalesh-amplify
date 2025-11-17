import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/regional
 * 
 * Get regional performance analytics based on shipping addresses
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * 
 * Returns:
 * - regionalData: Revenue and orders by region/city
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

    // Get orders with shipping addresses
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
        totalAmount: true,
        shippingAddress: true,
        userId: true,
      },
    });

    // Aggregate by region/city
    const regionalMap = new Map<string, {
      region: string;
      revenue: number;
      orders: number;
      userIds: Set<string>;
    }>();

    orders.forEach((order) => {
      // Extract city/region from shipping address
      let region = 'Unknown';
      
      if (order.shippingAddress && typeof order.shippingAddress === 'object') {
        const address = order.shippingAddress as any;
        region = address.city || address.region || address.state || 'Unknown';
      }
      
      if (!regionalMap.has(region)) {
        regionalMap.set(region, {
          region,
          revenue: 0,
          orders: 0,
          userIds: new Set(),
        });
      }
      
      const stats = regionalMap.get(region)!;
      stats.revenue += Number(order.totalAmount);
      stats.orders += 1;
      if (order.userId) {
        stats.userIds.add(order.userId);
      }
    });

    // Convert to array and sort by revenue
    const regionalData = Array.from(regionalMap.values())
      .map((stats) => ({
        region: stats.region,
        revenue: stats.revenue,
        orders: stats.orders,
        users: stats.userIds.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate total for percentages
    const totalRevenue = regionalData.reduce((sum, r) => sum + r.revenue, 0);

    // Add percentage to each region
    const regionalDataWithPercentages = regionalData.map((region) => ({
      ...region,
      percentage: totalRevenue > 0 ? (region.revenue / totalRevenue) * 100 : 0,
    }));

    return NextResponse.json({
      regionalData: regionalDataWithPercentages,
      totalRevenue,
      totalOrders: regionalData.reduce((sum, r) => sum + r.orders, 0),
      totalUsers: regionalData.reduce((sum, r) => sum + r.users, 0),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching regional analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regional analytics' },
      { status: 500 }
    );
  }
}
