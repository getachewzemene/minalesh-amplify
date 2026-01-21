import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { 
  createCSVResponse, 
  createExcelResponse, 
  createPDFResponse,
  aggregateByPeriod 
} from '@/lib/report-export';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/reports
 * Generate comprehensive reports for sales, inventory, customers, and more
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
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'sales';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json'; // json, csv, excel, pdf
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | null;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let reportData;

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(dateFilter, period);
        break;
      case 'inventory':
        reportData = await generateInventoryReport();
        break;
      case 'inventory-aging':
        reportData = await generateInventoryAgingReport();
        break;
      case 'customers':
        reportData = await generateCustomersReport(dateFilter);
        break;
      case 'customer-acquisition':
        reportData = await generateCustomerAcquisitionReport(dateFilter, period);
        break;
      case 'vendors':
        reportData = await generateVendorsReport(dateFilter);
        break;
      case 'vendor-performance':
        reportData = await generateVendorPerformanceReport(dateFilter);
        break;
      case 'product-performance':
        reportData = await generateProductPerformanceReport(dateFilter);
        break;
      case 'refunds':
        reportData = await generateRefundsReport(dateFilter);
        break;
      case 'shipping':
        reportData = await generateShippingReport(dateFilter);
        break;
      case 'payment-gateway':
        reportData = await generatePaymentGatewayReport(dateFilter);
        break;
      case 'tax':
        reportData = await generateTaxReport(dateFilter);
        break;
      case 'financial':
        reportData = await generateFinancialReport(dateFilter);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Handle export formats - extract data based on report type
    const getExportData = (data: any) => {
      return data.orders || data.products || data.customers || 
             data.vendors || data.refunds || data.shipments || 
             data.payments || data.taxRecords || [];
    };
    
    const exportData = getExportData(reportData);
    
    if (format === 'csv') {
      return createCSVResponse(exportData, `${reportType}-report`);
    } else if (format === 'excel') {
      return createExcelResponse(exportData, `${reportType}-report`, reportType);
    } else if (format === 'pdf') {
      return createPDFResponse(exportData, `${reportType}-report`, `${reportType.toUpperCase()} Report`);
    }

    return NextResponse.json({
      success: true,
      reportType,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateSalesReport(dateFilter: any, period?: 'daily' | 'weekly' | 'monthly' | null) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['delivered'] as const },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
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
  });

  const summary = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    totalItems: orders.reduce((sum, order) => sum + order.orderItems.length, 0),
    averageOrderValue: 0,
    topProducts: [] as any[],
    salesByDay: {} as any,
  };

  summary.averageOrderValue = summary.totalOrders > 0 
    ? summary.totalRevenue / summary.totalOrders 
    : 0;

  // Calculate top products
  const productSales: any = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const productName = item.product.name;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[productName].quantity += item.quantity;
      productSales[productName].revenue += Number(item.price) * item.quantity;
    });
  });

  summary.topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  // Aggregate by period if specified
  if (period) {
    const periodGroups = aggregateByPeriod(orders, 'createdAt', period);
    summary.salesByDay = Object.entries(periodGroups).reduce((acc, [key, periodOrders]) => {
      const ordersArray = periodOrders as any[];
      acc[key] = {
        orders: ordersArray.length,
        revenue: ordersArray.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0),
      };
      return acc;
    }, {} as any);
  } else {
    // Sales by day (default)
    orders.forEach((order) => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!summary.salesByDay[day]) {
        summary.salesByDay[day] = {
          orders: 0,
          revenue: 0,
        };
      }
      summary.salesByDay[day].orders += 1;
      summary.salesByDay[day].revenue += Number(order.totalAmount);
    });
  }

  return {
    summary,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.user.email,
      items: order.orderItems.length,
      total: Number(order.totalAmount),
      status: order.status,
    })),
  };
}

async function generateInventoryReport() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: {
        select: { name: true },
      },
      vendor: {
        select: { displayName: true },
      },
    },
  });

  const summary = {
    totalProducts: products.length,
    totalStockValue: products.reduce(
      (sum, product) => sum + Number(product.price) * product.stockQuantity,
      0
    ),
    lowStockProducts: products.filter((p) => p.stockQuantity < 10).length,
    outOfStockProducts: products.filter((p) => p.stockQuantity === 0).length,
    categoryBreakdown: {} as any,
  };

  // Category breakdown
  products.forEach((product) => {
    const categoryName = product.category?.name || 'Uncategorized';
    if (!summary.categoryBreakdown[categoryName]) {
      summary.categoryBreakdown[categoryName] = {
        products: 0,
        stock: 0,
        value: 0,
      };
    }
    summary.categoryBreakdown[categoryName].products += 1;
    summary.categoryBreakdown[categoryName].stock += product.stockQuantity;
    summary.categoryBreakdown[categoryName].value += Number(product.price) * product.stockQuantity;
  });

  return {
    summary,
    products: products.map((product) => ({
      name: product.name,
      sku: product.sku,
      category: product.category?.name,
      vendor: product.vendor?.displayName,
      stock: product.stockQuantity,
      price: Number(product.price),
      stockValue: Number(product.price) * product.stockQuantity,
      status: product.stockQuantity === 0 ? 'Out of Stock' : product.stockQuantity < 10 ? 'Low Stock' : 'In Stock',
    })),
  };
}

async function generateCustomersReport(dateFilter: any) {
  const customers = await prisma.user.findMany({
    where: {
      role: 'customer',
      createdAt: dateFilter,
    },
    include: {
      profile: true,
      orders: {
        where: {
          status: { in: ['delivered'] },
        },
      },
    },
  });

  const summary = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c) => c.orders.length > 0).length,
    totalLifetimeValue: customers.reduce(
      (sum, customer) =>
        sum + customer.orders.reduce((orderSum, order) => orderSum + Number(order.totalAmount), 0),
      0
    ),
    averageLifetimeValue: 0,
  };

  summary.averageLifetimeValue = summary.totalCustomers > 0
    ? summary.totalLifetimeValue / summary.totalCustomers
    : 0;

  return {
    summary,
    customers: customers.map((customer) => ({
      email: customer.email,
      name: customer.profile
        ? `${customer.profile.firstName || ''} ${customer.profile.lastName || ''}`
        : '',
      joinedAt: customer.createdAt,
      totalOrders: customer.orders.length,
      lifetimeValue: customer.orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      ),
    })),
  };
}

async function generateVendorsReport(dateFilter: any) {
  const vendors = await prisma.profile.findMany({
    where: {
      user: { role: 'vendor' },
      createdAt: dateFilter,
    },
    include: {
      user: true,
      products: true,
    },
  });

  return {
    summary: {
      totalVendors: vendors.length,
      approvedVendors: vendors.filter((v) => v.vendorStatus === 'approved').length,
      totalProducts: vendors.reduce((sum, v) => sum + v.products.length, 0),
    },
    vendors: vendors.map((vendor) => ({
      businessName: vendor.displayName,
      email: vendor.user.email,
      tradeLicense: vendor.tradeLicense,
      isApproved: vendor.vendorStatus === 'approved',
      productCount: vendor.products.length,
      joinedAt: vendor.createdAt,
    })),
  };
}

async function generateFinancialReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['delivered'] },
    },
  });

  const refunds = await prisma.refund.findMany({
    where: {
      createdAt: dateFilter,
      status: 'completed',
    },
  });

  const summary = {
    totalRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    totalRefunds: refunds.reduce((sum, refund) => sum + Number(refund.amount), 0),
    netRevenue: 0,
    taxCollected: orders.reduce((sum, order) => sum + Number(order.taxAmount || 0), 0),
    shippingRevenue: orders.reduce((sum, order) => sum + Number(order.shippingAmount || 0), 0),
  };

  summary.netRevenue = summary.totalRevenue - summary.totalRefunds;

  return {
    summary,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      subtotal: Number(order.subtotal),
      tax: Number(order.taxAmount || 0),
      shipping: Number(order.shippingAmount || 0),
      discount: Number(order.discountAmount || 0),
      total: Number(order.totalAmount),
    })),
    refunds: refunds.map((refund) => ({
      refundId: refund.id,
      date: refund.createdAt,
      amount: Number(refund.amount),
      reason: refund.reason,
    })),
  };
}

function convertToCSV(data: any): string {
  if (!data.orders && !data.products && !data.customers && !data.vendors) {
    return 'No data available';
  }

  const items = data.orders || data.products || data.customers || data.vendors || [];
  if (items.length === 0) return 'No data';

  const headers = Object.keys(items[0]);
  const rows = items.map((item: any) =>
    headers.map((header) => {
      const value = item[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// ============= NEW REPORT FUNCTIONS =============

async function generateVendorPerformanceReport(dateFilter: any) {
  const vendors = await prisma.profile.findMany({
    where: {
      user: { role: 'vendor' },
      vendorStatus: 'approved',
    },
    include: {
      user: true,
      products: {
        include: {
          reviews: true,
          orderItems: {
            where: {
              order: {
                createdAt: dateFilter,
                status: { in: ['delivered'] },
              },
            },
            include: {
              order: true,
            },
          },
        },
      },
    },
  });

  const vendorPerformance = vendors.map((vendor) => {
    const totalSales = vendor.products.reduce(
      (sum, product) =>
        sum +
        product.orderItems.reduce(
          (itemSum, item) => itemSum + Number(item.price) * item.quantity,
          0
        ),
      0
    );

    const totalOrders = vendor.products.reduce(
      (sum, product) => sum + product.orderItems.length,
      0
    );

    const avgRating = vendor.products.reduce((sum, product) => {
      const productAvg = product.reviews.reduce((rSum, review) => rSum + review.rating, 0) / 
                        (product.reviews.length || 1);
      return sum + productAvg;
    }, 0) / (vendor.products.length || 1);

    const commission = totalSales * (Number(vendor.commissionRate) / 100);

    return {
      vendorName: vendor.displayName,
      email: vendor.user.email,
      totalProducts: vendor.products.length,
      totalSales: totalSales,
      totalOrders: totalOrders,
      commission: commission,
      commissionRate: vendor.commissionRate,
      averageRating: avgRating.toFixed(2),
      totalReviews: vendor.products.reduce((sum, p) => sum + p.reviews.length, 0),
    };
  });

  return {
    summary: {
      totalVendors: vendorPerformance.length,
      totalSales: vendorPerformance.reduce((sum, v) => sum + v.totalSales, 0),
      totalCommission: vendorPerformance.reduce((sum, v) => sum + v.commission, 0),
      avgRating: vendorPerformance.reduce((sum, v) => sum + Number(v.averageRating), 0) / 
                 (vendorPerformance.length || 1),
    },
    vendors: vendorPerformance,
  };
}

async function generateProductPerformanceReport(dateFilter: any) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: { select: { name: true } },
      vendor: { select: { displayName: true } },
      reviews: true,
      orderItems: {
        where: {
          order: {
            createdAt: dateFilter,
            status: { in: ['delivered'] },
          },
        },
      },
    },
  });

  const productPerformance = products.map((product) => {
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = product.orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / 
                     (product.reviews.length || 1);

    return {
      productName: product.name,
      sku: product.sku,
      category: product.category?.name || 'N/A',
      vendor: product.vendor?.displayName || 'N/A',
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      totalSold: totalSold,
      revenue: revenue,
      currentStock: product.stockQuantity,
      viewCount: product.viewCount,
      averageRating: avgRating.toFixed(2),
      totalReviews: product.reviews.length,
      conversionRate: product.viewCount > 0 ? ((totalSold / product.viewCount) * 100).toFixed(2) : '0',
    };
  });

  return {
    summary: {
      totalProducts: productPerformance.length,
      totalRevenue: productPerformance.reduce((sum, p) => sum + p.revenue, 0),
      totalSold: productPerformance.reduce((sum, p) => sum + p.totalSold, 0),
      avgConversionRate: productPerformance.reduce((sum, p) => sum + Number(p.conversionRate), 0) / 
                        (productPerformance.length || 1),
    },
    products: productPerformance.sort((a, b) => b.revenue - a.revenue),
  };
}

async function generateCustomerAcquisitionReport(
  dateFilter: any,
  period?: 'daily' | 'weekly' | 'monthly' | null
) {
  const customers = await prisma.user.findMany({
    where: {
      role: 'customer',
      createdAt: dateFilter,
    },
    include: {
      profile: true,
      orders: {
        where: {
          status: { in: ['delivered'] },
        },
      },
    },
  });

  let acquisitionByPeriod = {};
  if (period) {
    const periodGroups = aggregateByPeriod(customers, 'createdAt', period);
    acquisitionByPeriod = Object.entries(periodGroups).reduce((acc, [key, periodCustomers]) => {
      const customersArray = periodCustomers as any[];
      acc[key] = {
        newCustomers: customersArray.length,
        withOrders: customersArray.filter((c: any) => c.orders.length > 0).length,
      };
      return acc;
    }, {} as any);
  }

  return {
    summary: {
      totalNewCustomers: customers.length,
      customersWithOrders: customers.filter((c) => c.orders.length > 0).length,
      conversionRate: customers.length > 0 
        ? ((customers.filter((c) => c.orders.length > 0).length / customers.length) * 100).toFixed(2)
        : '0',
      acquisitionByPeriod,
    },
    customers: customers.map((customer) => ({
      email: customer.email,
      name: customer.profile
        ? `${customer.profile.firstName || ''} ${customer.profile.lastName || ''}`
        : '',
      joinedAt: customer.createdAt,
      firstOrderDate: customer.orders[0]?.createdAt || null,
      totalOrders: customer.orders.length,
      lifetimeValue: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    })),
  };
}

async function generateRefundsReport(dateFilter: any) {
  const refunds = await prisma.refund.findMany({
    where: {
      createdAt: dateFilter,
    },
    include: {
      order: {
        include: {
          user: { select: { email: true } },
          orderItems: {
            include: {
              product: { select: { name: true } },
              vendor: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  const refundsByReason: Record<string, number> = {};
  const refundsByStatus: Record<string, number> = {};

  refunds.forEach((refund) => {
    refundsByReason[refund.reason] = (refundsByReason[refund.reason] || 0) + 1;
    refundsByStatus[refund.status] = (refundsByStatus[refund.status] || 0) + 1;
  });

  return {
    summary: {
      totalRefunds: refunds.length,
      totalAmount: refunds.reduce((sum, refund) => sum + Number(refund.amount), 0),
      approvedRefunds: refunds.filter((r) => r.status === 'completed').length,
      pendingRefunds: refunds.filter((r) => r.status === 'pending').length,
      rejectedRefunds: refunds.filter((r) => r.status === 'rejected').length,
      refundsByReason,
      refundsByStatus,
    },
    refunds: refunds.map((refund) => ({
      refundId: refund.id,
      orderNumber: refund.order.orderNumber,
      customerEmail: refund.order.user.email,
      amount: Number(refund.amount),
      reason: refund.reason,
      status: refund.status,
      requestedAt: refund.createdAt,
      processedAt: refund.updatedAt,
    })),
  };
}

async function generateShippingReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['shipped', 'delivered'] },
    },
    include: {
      deliveryTracking: true,
      user: { select: { email: true } },
      shippingMethod: { select: { name: true } },
    },
  });

  const shipments = orders.map((order) => {
    const tracking = order.deliveryTracking;
    let deliveryTime = null;
    
    if (tracking && tracking.actualDeliveryTime && order.createdAt) {
      deliveryTime = Math.floor(
        (tracking.actualDeliveryTime.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      orderNumber: order.orderNumber,
      customerEmail: order.user?.email || 'N/A',
      shippingMethod: order.shippingMethod?.name || 'N/A',
      courier: tracking?.courierName || 'N/A',
      trackingNumber: tracking?.providerTrackingId || 'N/A',
      status: order.status,
      shippedAt: order.inTransitAt || null,
      deliveredAt: tracking?.actualDeliveryTime || null,
      deliveryTime: deliveryTime,
      estimatedDelivery: tracking?.estimatedDeliveryEnd || null,
      shippingCost: Number(order.shippingAmount || 0),
    };
  });

  const avgDeliveryTime = shipments
    .filter((s) => s.deliveryTime !== null)
    .reduce((sum, s) => sum + (s.deliveryTime || 0), 0) / 
    (shipments.filter((s) => s.deliveryTime !== null).length || 1);

  return {
    summary: {
      totalShipments: shipments.length,
      delivered: shipments.filter((s) => s.status === 'delivered').length,
      inTransit: shipments.filter((s) => s.status === 'shipped' || s.status === 'in_transit').length,
      avgDeliveryTime: avgDeliveryTime.toFixed(2),
      totalShippingRevenue: shipments.reduce((sum, s) => sum + s.shippingCost, 0),
    },
    shipments,
  };
}

async function generatePaymentGatewayReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
    },
    select: {
      orderNumber: true,
      paymentStatus: true,
      paymentMethod: true,
      totalAmount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const paymentsByStatus: Record<string, number> = {};
  const paymentsByMethod: Record<string, number> = {};
  const revenueByMethod: Record<string, number> = {};

  orders.forEach((order) => {
    paymentsByStatus[order.paymentStatus] = (paymentsByStatus[order.paymentStatus] || 0) + 1;
    
    const method = order.paymentMethod || 'Unknown';
    paymentsByMethod[method] = (paymentsByMethod[method] || 0) + 1;
    revenueByMethod[method] = (revenueByMethod[method] || 0) + Number(order.totalAmount);
  });

  const totalPayments = orders.length;
  const successfulPayments = orders.filter((o) => o.paymentStatus === 'completed').length;
  const failedPayments = orders.filter((o) => o.paymentStatus === 'failed').length;

  return {
    summary: {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments: orders.filter((o) => o.paymentStatus === 'pending').length,
      successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(2) : '0',
      failureRate: totalPayments > 0 ? ((failedPayments / totalPayments) * 100).toFixed(2) : '0',
      totalRevenue: orders
        .filter((o) => o.paymentStatus === 'completed')
        .reduce((sum, o) => sum + Number(o.totalAmount), 0),
      paymentsByStatus,
      paymentsByMethod,
      revenueByMethod,
    },
    payments: orders.map((order) => ({
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod || 'N/A',
      status: order.paymentStatus,
      amount: Number(order.totalAmount),
      initiatedAt: order.createdAt,
      completedAt: order.updatedAt,
    })),
  };
}

async function generateInventoryAgingReport() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: { select: { name: true } },
      vendor: { select: { displayName: true } },
      orderItems: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  const now = new Date();
  const agingProducts = products.map((product) => {
    const lastSoldDate = product.orderItems[0]?.createdAt || product.createdAt;
    const daysInStock = Math.floor((now.getTime() - lastSoldDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let agingCategory = 'Fresh';
    if (daysInStock > 180) agingCategory = 'Dead Stock (>6 months)';
    else if (daysInStock > 90) agingCategory = 'Slow Moving (3-6 months)';
    else if (daysInStock > 30) agingCategory = 'Aging (1-3 months)';

    return {
      productName: product.name,
      sku: product.sku,
      category: product.category?.name || 'N/A',
      vendor: product.vendor?.displayName || 'N/A',
      stockQuantity: product.stockQuantity,
      price: Number(product.price),
      stockValue: Number(product.price) * product.stockQuantity,
      lastSoldDate: lastSoldDate,
      daysInStock,
      agingCategory,
      totalSales: product.saleCount,
    };
  });

  return {
    summary: {
      totalProducts: agingProducts.length,
      freshStock: agingProducts.filter((p) => p.agingCategory === 'Fresh').length,
      agingStock: agingProducts.filter((p) => p.agingCategory.includes('Aging')).length,
      slowMoving: agingProducts.filter((p) => p.agingCategory.includes('Slow')).length,
      deadStock: agingProducts.filter((p) => p.agingCategory.includes('Dead')).length,
      totalStockValue: agingProducts.reduce((sum, p) => sum + p.stockValue, 0),
    },
    products: agingProducts.sort((a, b) => b.daysInStock - a.daysInStock),
  };
}

/**
 * Ethiopian VAT rate - can be adjusted for different tax jurisdictions
 */
const ETHIOPIAN_VAT_RATE = 0.15; // 15% VAT

async function generateTaxReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['delivered'] },
    },
    include: {
      user: { select: { email: true } },
      orderItems: {
        include: {
          vendor: { 
            select: { 
              displayName: true,
              tinNumber: true,
            } 
          },
        },
      },
    },
  });

  const taxByVendor: Record<string, any> = {};
  let totalTaxCollected = 0;

  orders.forEach((order) => {
    const taxAmount = Number(order.taxAmount || 0);
    totalTaxCollected += taxAmount;

    order.orderItems.forEach((item) => {
      const vendorName = item.vendor?.displayName || 'Platform';
      const vendorTin = item.vendor?.tinNumber || 'N/A';
      
      if (!taxByVendor[vendorName]) {
        taxByVendor[vendorName] = {
          vendorName,
          tinNumber: vendorTin,
          totalSales: 0,
          taxCollected: 0,
          orderCount: 0,
        };
      }
      
      const itemTotal = Number(item.price) * item.quantity;
      taxByVendor[vendorName].totalSales += itemTotal;
      taxByVendor[vendorName].taxCollected += (itemTotal * ETHIOPIAN_VAT_RATE);
      taxByVendor[vendorName].orderCount += 1;
    });
  });

  return {
    summary: {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0),
      totalTaxCollected,
      totalVendors: Object.keys(taxByVendor).length,
      reportingPeriod: {
        start: dateFilter.gte || 'All time',
        end: dateFilter.lte || new Date(),
      },
    },
    taxRecords: Object.values(taxByVendor).sort((a: any, b: any) => b.taxCollected - a.taxCollected),
  };
}
