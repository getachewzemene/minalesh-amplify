import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/reports
 * Generate comprehensive reports for sales, inventory, customers, and more
 */
export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'sales';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json'; // json or csv

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let reportData;

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(dateFilter);
        break;
      case 'inventory':
        reportData = await generateInventoryReport();
        break;
      case 'customers':
        reportData = await generateCustomersReport(dateFilter);
        break;
      case 'vendors':
        reportData = await generateVendorsReport(dateFilter);
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

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString()}.csv"`,
        },
      });
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
});

async function generateSalesReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['delivered', 'completed'] },
    },
    include: {
      items: {
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
    totalItems: orders.reduce((sum, order) => sum + order.items.length, 0),
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
    order.items.forEach((item) => {
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

  // Sales by day
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

  return {
    summary,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.user.email,
      items: order.items.length,
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
        select: { businessName: true },
      },
    },
  });

  const summary = {
    totalProducts: products.length,
    totalStockValue: products.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0
    ),
    lowStockProducts: products.filter((p) => p.stock < 10).length,
    outOfStockProducts: products.filter((p) => p.stock === 0).length,
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
    summary.categoryBreakdown[categoryName].stock += product.stock;
    summary.categoryBreakdown[categoryName].value += Number(product.price) * product.stock;
  });

  return {
    summary,
    products: products.map((product) => ({
      name: product.name,
      sku: product.sku,
      category: product.category?.name,
      vendor: product.vendor?.businessName,
      stock: product.stock,
      price: Number(product.price),
      stockValue: Number(product.price) * product.stock,
      status: product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock',
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
          status: { in: ['delivered', 'completed'] },
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
      approvedVendors: vendors.filter((v) => v.isApproved).length,
      totalProducts: vendors.reduce((sum, v) => sum + v.products.length, 0),
    },
    vendors: vendors.map((vendor) => ({
      businessName: vendor.businessName,
      email: vendor.user.email,
      tradeLicense: vendor.tradeLicense,
      isApproved: vendor.isApproved,
      productCount: vendor.products.length,
      joinedAt: vendor.createdAt,
    })),
  };
}

async function generateFinancialReport(dateFilter: any) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: dateFilter,
      status: { in: ['delivered', 'completed'] },
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
