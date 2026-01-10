/**
 * Advanced Analytics Dashboard API
 * Comprehensive analytics for admin users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getDashboardAnalytics,
  getRevenueMetrics,
  getCustomerMetrics,
  getProductMetrics,
  getVendorMetrics,
  getOperationalMetrics,
  getRealTimeMetrics,
} from '@/lib/advanced-analytics';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/analytics/advanced
 * Get comprehensive analytics dashboard data
 * 
 * Query params:
 * - days: number of days to analyze (default: 30)
 * - metric: specific metric to fetch (revenue, customers, products, vendors, operations, realtime)
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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const metric = searchParams.get('metric');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Validate days
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = endDateParam ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());
    const startDate = startDateParam 
      ? startOfDay(new Date(startDateParam)) 
      : startOfDay(subDays(endDate, days));
    const dateRange = { startDate, endDate };

    // If specific metric requested
    if (metric) {
      let data;
      switch (metric) {
        case 'revenue':
          data = await getRevenueMetrics(dateRange);
          break;
        case 'customers':
          data = await getCustomerMetrics(dateRange);
          break;
        case 'products':
          data = await getProductMetrics();
          break;
        case 'vendors':
          data = await getVendorMetrics(dateRange);
          break;
        case 'operations':
          data = await getOperationalMetrics(dateRange);
          break;
        case 'realtime':
          data = await getRealTimeMetrics();
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid metric type' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        metric,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        data,
      });
    }

    // Get full dashboard data
    const dashboardData = await getDashboardAnalytics(days);

    return NextResponse.json({
      success: true,
      ...dashboardData,
    });
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
