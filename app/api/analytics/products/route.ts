import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/products
 * 
 * Get product performance analytics
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * - limit: number of top products to return (default: 10)
 * 
 * Returns:
 * - topProducts: Top selling products by revenue
 * - categoryBreakdown: Revenue by category
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get order items in the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: ['cancelled', 'refunded'],
          },
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        price: true,
        product: {
          select: {
            name: true,
            categoryId: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<string, {
      id: string;
      name: string;
      revenue: number;
      unitsSold: number;
      categoryName: string | null;
    }>();

    orderItems.forEach((item) => {
      const productId = item.productId || 'unknown';
      const productName = item.product?.name || item.productName || 'Unknown Product';
      const categoryName = item.product?.category?.name || null;
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: productName,
          revenue: 0,
          unitsSold: 0,
          categoryName,
        });
      }
      
      const stats = productMap.get(productId)!;
      stats.revenue += Number(item.price) * item.quantity;
      stats.unitsSold += item.quantity;
    });

    // Sort by revenue and take top N
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((product, index) => ({
        rank: index + 1,
        ...product,
      }));

    // Aggregate by category
    const categoryMap = new Map<string, {
      name: string;
      revenue: number;
      orders: number;
    }>();

    orderItems.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          revenue: 0,
          orders: 0,
        });
      }
      
      const stats = categoryMap.get(categoryName)!;
      stats.revenue += Number(item.price) * item.quantity;
      stats.orders += item.quantity;
    });

    // Calculate total revenue for percentage
    const totalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );

    // Sort categories by revenue
    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((cat) => ({
        ...cat,
        percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
      }));

    return NextResponse.json({
      topProducts,
      categoryBreakdown,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}
