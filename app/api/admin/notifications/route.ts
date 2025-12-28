import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/notifications
 * Returns admin notifications (alerts, warnings, important events)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const now = new Date();
    const notifications: any[] = [];

    // Check for low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: { lt: 10 },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        vendor: {
          select: {
            displayName: true,
          },
        },
      },
      take: 5,
    });

    lowStockProducts.forEach((product) => {
      notifications.push({
        id: `low-stock-${product.id}`,
        type: 'warning',
        category: 'inventory',
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.stockQuantity} items left`,
        metadata: {
          productId: product.id,
          productName: product.name,
          stock: product.stockQuantity,
          vendor: product.vendor?.displayName,
        },
        timestamp: now.toISOString(),
        actionUrl: `/admin/dashboard?tab=products&productId=${product.id}`,
      });
    });

    // Check for pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'pending',
        createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // older than 24 hours
      },
    });

    if (pendingOrders > 0) {
      notifications.push({
        id: 'pending-orders',
        type: 'warning',
        category: 'orders',
        title: 'Pending Orders',
        message: `${pendingOrders} orders have been pending for more than 24 hours`,
        metadata: {
          count: pendingOrders,
        },
        timestamp: now.toISOString(),
        actionUrl: '/admin/dashboard?tab=orders&status=pending',
      });
    }

    // Check for pending vendor verifications
    const pendingVendors = await prisma.profile.count({
      where: {
        user: { role: 'vendor' },
        vendorStatus: 'pending',
      },
    });

    if (pendingVendors > 0) {
      notifications.push({
        id: 'pending-vendors',
        type: 'info',
        category: 'vendors',
        title: 'Pending Vendor Verifications',
        message: `${pendingVendors} vendors are waiting for approval`,
        metadata: {
          count: pendingVendors,
        },
        timestamp: now.toISOString(),
        actionUrl: '/admin/dashboard?tab=vendors',
      });
    }

    // Check for suspicious orders (high value, new customer)
    const suspiciousOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
        totalAmount: { gt: 50000 }, // orders over 50,000 ETB
        user: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // new users (< 7 days)
        },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
      take: 3,
    });

    suspiciousOrders.forEach((order) => {
      notifications.push({
        id: `suspicious-order-${order.id}`,
        type: 'alert',
        category: 'fraud',
        title: 'Suspicious Order Detected',
        message: `High-value order ${order.orderNumber} from new customer (${order.user.email})`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          userEmail: order.user.email,
          userAge: Math.floor((now.getTime() - order.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
        },
        timestamp: now.toISOString(),
        actionUrl: `/admin/dashboard?tab=orders&orderId=${order.id}`,
      });
    });

    // Check for failed payments in last 24 hours
    const failedPayments = await prisma.order.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (failedPayments > 5) {
      notifications.push({
        id: 'failed-payments',
        type: 'alert',
        category: 'payments',
        title: 'High Payment Failure Rate',
        message: `${failedPayments} payments failed in the last 24 hours`,
        metadata: {
          count: failedPayments,
        },
        timestamp: now.toISOString(),
        actionUrl: '/admin/dashboard?tab=orders&status=payment_failed',
      });
    }

    // Sort by type priority (alert > warning > info)
    const typePriority = { alert: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => typePriority[a.type as keyof typeof typePriority] - typePriority[b.type as keyof typeof typePriority]);

    return NextResponse.json({
      success: true,
      notifications,
      summary: {
        total: notifications.length,
        alerts: notifications.filter((n) => n.type === 'alert').length,
        warnings: notifications.filter((n) => n.type === 'warning').length,
        info: notifications.filter((n) => n.type === 'info').length,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
