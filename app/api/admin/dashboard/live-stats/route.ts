import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/dashboard/live-stats
 * Returns real-time dashboard statistics for admin
 */
export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Real-time stats for today
    const [
      todayOrders,
      todayRevenue,
      todayNewUsers,
      todayNewVendors,
      activeUsersLast24h,
      pendingOrders,
      lowStockProducts,
      pendingVendorVerifications,
      recentActivity,
    ] = await Promise.all([
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
      
      // Today's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { in: ['confirmed', 'processing', 'shipped', 'delivered', 'completed'] },
        },
        _sum: { totalAmount: true },
      }),
      
      // Today's new users
      prisma.user.count({
        where: {
          createdAt: { gte: todayStart },
          role: 'customer',
        },
      }),
      
      // Today's new vendors
      prisma.profile.count({
        where: {
          createdAt: { gte: todayStart },
          user: { role: 'vendor' },
        },
      }),
      
      // Active users in last 24 hours
      prisma.user.count({
        where: {
          updatedAt: { gte: last24Hours },
        },
      }),
      
      // Pending orders
      prisma.order.count({
        where: {
          status: 'pending',
        },
      }),
      
      // Low stock products (stock < 10)
      prisma.product.count({
        where: {
          stock: { lt: 10 },
          isActive: true,
        },
      }),
      
      // Pending vendor verifications
      prisma.profile.count({
        where: {
          user: { role: 'vendor' },
          isApproved: false,
        },
      }),
      
      // Recent activity (last 10 actions)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate growth rates (comparing last 7 days vs previous 7 days)
    const previous7Days = new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [currentWeekOrders, previousWeekOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.order.count({
        where: { 
          createdAt: { 
            gte: previous7Days,
            lt: last7Days,
          },
        },
      }),
    ]);

    const ordersGrowth = previousWeekOrders > 0 
      ? ((currentWeekOrders - previousWeekOrders) / previousWeekOrders) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats: {
        today: {
          orders: todayOrders,
          revenue: todayRevenue._sum.totalAmount || 0,
          newUsers: todayNewUsers,
          newVendors: todayNewVendors,
        },
        last24Hours: {
          activeUsers: activeUsersLast24h,
        },
        pending: {
          orders: pendingOrders,
          vendorVerifications: pendingVendorVerifications,
        },
        alerts: {
          lowStockProducts,
        },
        growth: {
          ordersWeekly: ordersGrowth.toFixed(1),
        },
      },
      recentActivity: recentActivity.map((order) => ({
        type: 'order',
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        amount: order.totalAmount,
        timestamp: order.createdAt,
        user: {
          email: order.user.email,
          name: order.user.profile
            ? `${order.user.profile.firstName || ''} ${order.user.profile.lastName || ''}`
            : order.user.email,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching live stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live statistics' },
      { status: 500 }
    );
  }
});
