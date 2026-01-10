/**
 * System Health Monitoring API
 * Admin endpoint for viewing system health metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getSystemHealthOverview,
  getHealthMetricSummary,
  getRecentHealthMetrics,
  collectApplicationMetrics,
} from '@/lib/monitoring';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/monitoring/health
 * Get system health overview and metrics
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
    const action = searchParams.get('action');
    const metricType = searchParams.get('metricType');
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    switch (action) {
      case 'summary':
        const summary = await getHealthMetricSummary(hours);
        return NextResponse.json({
          success: true,
          summary,
          hours,
        });

      case 'metrics':
        const metrics = await getRecentHealthMetrics(metricType || undefined, hours);
        return NextResponse.json({
          success: true,
          metrics,
          hours,
        });

      default:
        // Default: get full health overview
        const overview = await getSystemHealthOverview();
        return NextResponse.json({
          success: true,
          ...overview,
        });
    }
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring/health
 * Trigger metric collection (for testing/manual collection)
 */
export async function POST(req: NextRequest) {
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

    const metrics = await collectApplicationMetrics();

    return NextResponse.json({
      success: true,
      message: 'Metrics collected successfully',
      metrics,
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
