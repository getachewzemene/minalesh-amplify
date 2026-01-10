/**
 * Advanced Analytics Service
 * Comprehensive analytics for the admin dashboard
 */

import prisma from './prisma';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  revenueByCategory: { category: string; revenue: number; percentage: number }[];
  revenueByPaymentMethod: { method: string; revenue: number; count: number }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageLifetimeValue: number;
  topCustomers: { email: string; name: string; totalSpent: number; orderCount: number }[];
  customersByRegion: { region: string; count: number }[];
}

export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: { id: string; name: string; sales: number; revenue: number }[];
  productPerformance: { id: string; name: string; views: number; conversions: number; conversionRate: number }[];
  inventoryValue: number;
}

export interface VendorMetrics {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  topVendors: { id: string; name: string; sales: number; revenue: number; rating: number }[];
  vendorPerformance: { id: string; name: string; orderFulfillmentRate: number; avgShippingTime: number }[];
  totalCommissions: number;
}

export interface OperationalMetrics {
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageFulfillmentTime: number;
  averageDeliveryTime: number;
  openDisputes: number;
  resolvedDisputes: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  ordersToday: number;
  revenueToday: number;
  cartAbandonment: number;
  conversionRate: number;
  averageSessionDuration: number;
}

/**
 * Get revenue metrics for a date range
 */
export async function getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
  const { startDate, endDate } = dateRange;

  // Get order statistics
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ['cancelled', 'refunded'] },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const orderCount = orders.length;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Revenue by day
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const revenueByDay = days.map((day) => {
    const dayOrders = orders.filter((o) => {
      const orderDate = startOfDay(o.createdAt);
      return orderDate.getTime() === startOfDay(day).getTime();
    });
    return {
      date: format(day, 'yyyy-MM-dd'),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orders: dayOrders.length,
    };
  });

  // Revenue by category
  const categoryMap = new Map<string, number>();
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const category = item.product?.category?.name || 'Uncategorized';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + Number(item.total));
    });
  });

  const revenueByCategory = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Revenue by payment method
  const methodMap = new Map<string, { revenue: number; count: number }>();
  orders.forEach((order) => {
    const method = order.paymentMethod || 'Unknown';
    const current = methodMap.get(method) || { revenue: 0, count: 0 };
    methodMap.set(method, {
      revenue: current.revenue + Number(order.totalAmount),
      count: current.count + 1,
    });
  });

  const revenueByPaymentMethod = Array.from(methodMap.entries()).map(
    ([method, data]) => ({ method, ...data })
  );

  return {
    totalRevenue,
    orderCount,
    averageOrderValue,
    revenueByDay,
    revenueByCategory,
    revenueByPaymentMethod,
  };
}

/**
 * Get customer metrics for a date range
 */
export async function getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
  const { startDate, endDate } = dateRange;

  // Total customers
  const totalCustomers = await prisma.user.count({
    where: { role: 'customer' },
  });

  // New customers in period
  const newCustomers = await prisma.user.count({
    where: {
      role: 'customer',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // Get customers with orders
  const customersWithOrders = await prisma.user.findMany({
    where: { role: 'customer' },
    include: {
      profile: true,
      orders: {
        where: { status: { notIn: ['cancelled', 'refunded'] } },
      },
    },
  });

  // Calculate returning customers
  const returningCustomers = customersWithOrders.filter(
    (c) => c.orders.length > 1
  ).length;
  const customersWithAnyOrder = customersWithOrders.filter(
    (c) => c.orders.length > 0
  ).length;
  const customerRetentionRate =
    customersWithAnyOrder > 0 ? (returningCustomers / customersWithAnyOrder) * 100 : 0;

  // Average lifetime value
  const lifetimeValues = customersWithOrders.map((c) =>
    c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  );
  const averageLifetimeValue =
    lifetimeValues.length > 0
      ? lifetimeValues.reduce((a, b) => a + b, 0) / lifetimeValues.length
      : 0;

  // Top customers
  const topCustomers = customersWithOrders
    .map((c) => ({
      email: c.email,
      name: c.profile
        ? `${c.profile.firstName || ''} ${c.profile.lastName || ''}`.trim()
        : '',
      totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orderCount: c.orders.length,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Customers by region (city)
  const regionMap = new Map<string, number>();
  customersWithOrders.forEach((c) => {
    if (c.profile?.city) {
      const current = regionMap.get(c.profile.city) || 0;
      regionMap.set(c.profile.city, current + 1);
    }
  });
  const customersByRegion = Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    customerRetentionRate,
    averageLifetimeValue,
    topCustomers,
    customersByRegion,
  };
}

/**
 * Get product metrics
 */
export async function getProductMetrics(): Promise<ProductMetrics> {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      orderItems: {
        include: {
          order: {
            select: { status: true },
          },
        },
      },
    },
  });

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
  ).length;
  const outOfStockProducts = products.filter((p) => p.stockQuantity === 0).length;

  // Top selling products
  const topSellingProducts = products
    .map((p) => {
      const completedItems = p.orderItems.filter(
        (i) => i.order.status === 'delivered'
      );
      const sales = completedItems.reduce((sum, i) => sum + i.quantity, 0);
      const revenue = completedItems.reduce((sum, i) => sum + Number(i.total), 0);
      return { id: p.id, name: p.name, sales, revenue };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  // Product performance (views vs purchases)
  const productPerformance = products
    .map((p) => {
      const purchases = p.orderItems.filter(
        (i) => i.order.status === 'delivered'
      ).length;
      return {
        id: p.id,
        name: p.name,
        views: p.viewCount,
        conversions: purchases,
        conversionRate: p.viewCount > 0 ? (purchases / p.viewCount) * 100 : 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  // Total inventory value
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * p.stockQuantity,
    0
  );

  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    topSellingProducts,
    productPerformance,
    inventoryValue,
  };
}

/**
 * Get vendor metrics
 */
export async function getVendorMetrics(dateRange: DateRange): Promise<VendorMetrics> {
  const { startDate, endDate } = dateRange;

  const vendors = await prisma.profile.findMany({
    where: { isVendor: true },
    include: {
      user: true,
      orderItems: {
        include: {
          order: {
            select: {
              status: true,
              createdAt: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
      sellerRatings: true,
    },
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.vendorStatus === 'approved').length;
  const pendingVendors = vendors.filter((v) => v.vendorStatus === 'pending').length;

  // Top vendors by revenue
  const topVendors = vendors
    .map((v) => {
      const deliveredItems = v.orderItems.filter(
        (i) => i.order.status === 'delivered'
      );
      const sales = deliveredItems.reduce((sum, i) => sum + i.quantity, 0);
      const revenue = deliveredItems.reduce((sum, i) => sum + Number(i.total), 0);
      const avgRating =
        v.sellerRatings.length > 0
          ? v.sellerRatings.reduce((sum, r) => sum + Number(r.overallRating), 0) /
            v.sellerRatings.length
          : 0;
      return {
        id: v.id,
        name: v.displayName || v.user.email,
        sales,
        revenue,
        rating: Number(avgRating.toFixed(2)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Vendor performance
  const vendorPerformance = vendors.map((v) => {
    const totalOrders = v.orderItems.length;
    const fulfilledOrders = v.orderItems.filter(
      (i) => ['shipped', 'delivered'].includes(i.order.status)
    ).length;
    const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 100;

    // Calculate average shipping time (from order to shipped)
    const shippedItems = v.orderItems.filter((i) => i.order.shippedAt);
    const shippingTimes = shippedItems.map((i) => {
      const orderDate = i.order.createdAt.getTime();
      const shippedDate = i.order.shippedAt!.getTime();
      return (shippedDate - orderDate) / (1000 * 60 * 60 * 24); // days
    });
    const avgShippingTime =
      shippingTimes.length > 0
        ? shippingTimes.reduce((a, b) => a + b, 0) / shippingTimes.length
        : 0;

    return {
      id: v.id,
      name: v.displayName || v.user.email,
      orderFulfillmentRate: Number(fulfillmentRate.toFixed(2)),
      avgShippingTime: Number(avgShippingTime.toFixed(1)),
    };
  });

  // Total commissions
  const commissionsResult = await prisma.commissionLedger.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _sum: { commissionAmount: true },
  });
  const totalCommissions = Number(commissionsResult._sum.commissionAmount || 0);

  return {
    totalVendors,
    activeVendors,
    pendingVendors,
    topVendors,
    vendorPerformance,
    totalCommissions,
  };
}

/**
 * Get operational metrics
 */
export async function getOperationalMetrics(dateRange: DateRange): Promise<OperationalMetrics> {
  const { startDate, endDate } = dateRange;

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      status: true,
      createdAt: true,
      confirmedAt: true,
      shippedAt: true,
      deliveredAt: true,
    },
  });

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate average fulfillment time (order to shipped)
  const fulfilledOrders = orders.filter((o) => o.shippedAt);
  const fulfillmentTimes = fulfilledOrders.map((o) => {
    const orderDate = o.createdAt.getTime();
    const shippedDate = o.shippedAt!.getTime();
    return (shippedDate - orderDate) / (1000 * 60 * 60); // hours
  });
  const averageFulfillmentTime =
    fulfillmentTimes.length > 0
      ? fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length
      : 0;

  // Calculate average delivery time (shipped to delivered)
  const deliveredOrders = orders.filter((o) => o.deliveredAt && o.shippedAt);
  const deliveryTimes = deliveredOrders.map((o) => {
    const shippedDate = o.shippedAt!.getTime();
    const deliveredDate = o.deliveredAt!.getTime();
    return (deliveredDate - shippedDate) / (1000 * 60 * 60 * 24); // days
  });
  const averageDeliveryTime =
    deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

  // Dispute metrics
  const disputes = await prisma.dispute.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { status: true },
  });

  const openDisputes = disputes.filter((d) =>
    ['open', 'pending_vendor_response', 'pending_admin_review'].includes(d.status)
  ).length;
  const resolvedDisputes = disputes.filter((d) =>
    ['resolved', 'closed'].includes(d.status)
  ).length;

  return {
    pendingOrders: statusCounts['pending'] || 0,
    processingOrders: statusCounts['processing'] || 0,
    shippedOrders: statusCounts['shipped'] || 0,
    deliveredOrders: statusCounts['delivered'] || 0,
    cancelledOrders: statusCounts['cancelled'] || 0,
    refundedOrders: statusCounts['refunded'] || 0,
    averageFulfillmentTime: Number(averageFulfillmentTime.toFixed(1)),
    averageDeliveryTime: Number(averageDeliveryTime.toFixed(1)),
    openDisputes,
    resolvedDisputes,
  };
}

/**
 * Get real-time metrics (approximate - based on recent data)
 */
export async function getRealTimeMetrics(): Promise<RealTimeMetrics> {
  const today = startOfDay(new Date());
  const now = new Date();

  // Orders today
  const ordersToday = await prisma.order.count({
    where: {
      createdAt: { gte: today },
    },
  });

  // Revenue today
  const revenueResult = await prisma.order.aggregate({
    where: {
      createdAt: { gte: today },
      status: { notIn: ['cancelled', 'refunded'] },
    },
    _sum: { totalAmount: true },
  });
  const revenueToday = Number(revenueResult._sum.totalAmount || 0);

  // Active users (sessions in last 30 minutes)
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const activeUsers = await prisma.analyticsEvent.groupBy({
    by: ['sessionId'],
    where: {
      createdAt: { gte: thirtyMinutesAgo },
      sessionId: { not: null },
    },
  });

  // Cart abandonment (carts created today without orders)
  const cartsToday = await prisma.cart.count({
    where: { createdAt: { gte: today } },
  });
  const cartAbandonment = cartsToday > 0 && ordersToday > 0 
    ? ((cartsToday - ordersToday) / cartsToday) * 100 
    : 0;

  // Conversion rate (orders / unique visitors today)
  const uniqueVisitors = await prisma.analyticsEvent.groupBy({
    by: ['sessionId'],
    where: {
      createdAt: { gte: today },
      eventType: 'page_view',
    },
  });
  const conversionRate =
    uniqueVisitors.length > 0 ? (ordersToday / uniqueVisitors.length) * 100 : 0;

  return {
    activeUsers: activeUsers.length,
    ordersToday,
    revenueToday,
    cartAbandonment: Number(cartAbandonment.toFixed(1)),
    conversionRate: Number(conversionRate.toFixed(2)),
    averageSessionDuration: 0, // Would need more detailed session tracking
  };
}

/**
 * Get comprehensive analytics dashboard data
 */
export async function getDashboardAnalytics(days: number = 30) {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days));
  const dateRange = { startDate, endDate };

  const [revenue, customers, products, vendors, operations, realTime] = await Promise.all([
    getRevenueMetrics(dateRange),
    getCustomerMetrics(dateRange),
    getProductMetrics(),
    getVendorMetrics(dateRange),
    getOperationalMetrics(dateRange),
    getRealTimeMetrics(),
  ]);

  return {
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days,
    },
    revenue,
    customers,
    products,
    vendors,
    operations,
    realTime,
  };
}
