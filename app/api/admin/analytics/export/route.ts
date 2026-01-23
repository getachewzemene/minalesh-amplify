/**
 * Advanced Analytics Export API
 * Export analytics data in CSV, Excel, and PDF formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF 
} from '@/lib/report-export';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import prisma from '@/lib/prisma';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/analytics/export
 * Export analytics data
 * 
 * Query params:
 * - format: csv, excel, pdf (required)
 * - type: revenue, products, customers, regional (required)
 * - days: number of days to analyze (default: 30)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, excel, or pdf' },
        { status: 400 }
      );
    }

    if (!type || !['revenue', 'products', 'customers', 'regional'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be revenue, products, customers, or regional' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = endDateParam ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());
    const startDate = startDateParam 
      ? startOfDay(new Date(startDateParam)) 
      : startOfDay(subDays(endDate, days));

    let data: any[] = [];
    let title = '';

    // Fetch data based on type
    switch (type) {
      case 'revenue':
        title = 'Revenue Trends Report';
        const orders = await prisma.order.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['cancelled', 'refunded'] },
          },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true,
          },
        });

        data = orders.map(order => ({
          'Order ID': order.id,
          'Date': order.createdAt.toISOString().split('T')[0],
          'Amount (ETB)': Number(order.totalAmount).toFixed(2),
          'Status': order.status,
        }));
        break;

      case 'products':
        title = 'Product Performance Report';
        const products = await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              createdAt: { gte: startDate, lte: endDate },
              status: { notIn: ['cancelled', 'refunded'] },
            },
          },
          _count: { id: true },
          _sum: { 
            quantity: true,
            price: true,
          },
        });

        const productsWithDetails = await Promise.all(
          products.map(async (p) => {
            const product = await prisma.product.findUnique({
              where: { id: p.productId },
              select: { name: true },
            });
            return {
              'Product Name': product?.name || 'Unknown',
              'Units Sold': p._sum.quantity || 0,
              'Total Revenue (ETB)': Number(p._sum.price || 0).toFixed(2),
              'Number of Orders': p._count.id,
            };
          })
        );
        data = productsWithDetails;
        break;

      case 'customers':
        title = 'Customer Analytics Report';
        const customers = await prisma.user.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            role: 'customer',
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        });

        const customerData = await Promise.all(
          customers.map(async (customer) => {
            const orderCount = await prisma.order.count({
              where: { userId: customer.id },
            });
            return {
              'Customer Email': customer.email,
              'Joined Date': customer.createdAt.toISOString().split('T')[0],
              'Total Orders': orderCount,
            };
          })
        );
        data = customerData;
        break;

      case 'regional':
        title = 'Geographic Distribution Report';
        const regionalOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { notIn: ['cancelled', 'refunded'] },
          },
          select: {
            id: true,
            totalAmount: true,
            shippingAddress: true,
          },
        });

        const regionMap = new Map<string, { orders: number; revenue: number }>();
        regionalOrders.forEach(order => {
          let city = 'Unknown';
          if (order.shippingAddress && typeof order.shippingAddress === 'object') {
            const addr = order.shippingAddress as any;
            city = addr.city || 'Unknown';
          }
          const existing = regionMap.get(city) || { orders: 0, revenue: 0 };
          regionMap.set(city, {
            orders: existing.orders + 1,
            revenue: existing.revenue + Number(order.totalAmount),
          });
        });

        data = Array.from(regionMap.entries()).map(([city, stats]) => ({
          'City': city,
          'Total Orders': stats.orders,
          'Total Revenue (ETB)': stats.revenue.toFixed(2),
        }));
        break;
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the selected criteria' },
        { status: 404 }
      );
    }

    // Generate export based on format
    let content: ArrayBuffer | Buffer;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        const csvString = exportToCSV(data, { title });
        content = Buffer.from(csvString);
        contentType = 'text/csv';
        filename = `${type}-analytics-${timestamp}.csv`;
        break;

      case 'excel':
        const excelBuffer = await exportToExcel(data, { title });
        content = Buffer.from(excelBuffer);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${type}-analytics-${timestamp}.xlsx`;
        break;

      case 'pdf':
        const pdf = exportToPDF(data, { title });
        const pdfArrayBuffer = pdf.output('arraybuffer');
        content = Buffer.from(pdfArrayBuffer);
        contentType = 'application/pdf';
        filename = `${type}-analytics-${timestamp}.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
