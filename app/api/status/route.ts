/**
 * Public Status Page API
 * Customer-facing endpoint showing system status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealthOverview, getRecentHealthMetrics } from '@/lib/monitoring';
import { checkDatabaseConnection } from '@/lib/database-health';

export const dynamic = 'force-dynamic';

interface StatusPageData {
  status: 'operational' | 'degraded' | 'outage';
  lastUpdated: string;
  uptime: number;
  components: {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    description?: string;
  }[];
  incidents?: {
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    createdAt: string;
    updates: {
      message: string;
      timestamp: string;
    }[];
  }[];
}

/**
 * GET /api/status
 * Returns public-facing system status
 */
export async function GET(req: NextRequest) {
  try {
    // Check database health
    const dbHealth = await checkDatabaseConnection();
    
    // Get system health metrics (last 1 hour)
    const metrics = await getRecentHealthMetrics(undefined, 1);
    
    // Determine component statuses
    const components = [
      {
        name: 'API',
        status: dbHealth.connected ? 'operational' : 'outage',
        description: 'Core API services',
      } as const,
      {
        name: 'Database',
        status: dbHealth.connected
          ? dbHealth.latency && dbHealth.latency > 200
            ? 'degraded'
            : 'operational'
          : 'outage',
        description: 'Database connectivity',
      } as const,
      {
        name: 'Payments',
        status: 'operational' as const,
        description: 'Payment processing',
      },
      {
        name: 'Notifications',
        status: 'operational' as const,
        description: 'Email and SMS notifications',
      },
    ];
    
    // Calculate overall status
    let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
    
    if (components.some(c => c.status === 'outage')) {
      overallStatus = 'outage';
    } else if (components.some(c => c.status === 'degraded')) {
      overallStatus = 'degraded';
    }
    
    // Check for recent critical metrics
    const criticalMetrics = metrics.filter(m => m.status === 'critical');
    if (criticalMetrics.length > 0 && overallStatus === 'operational') {
      overallStatus = 'degraded';
    }
    
    const statusData: StatusPageData = {
      status: overallStatus,
      lastUpdated: new Date().toISOString(),
      uptime: process.uptime(),
      components,
    };
    
    return NextResponse.json(statusData, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Status page error:', error);
    
    return NextResponse.json(
      {
        status: 'outage',
        lastUpdated: new Date().toISOString(),
        uptime: process.uptime(),
        components: [
          {
            name: 'System',
            status: 'outage',
            description: 'Unable to determine system status',
          },
        ],
      } as StatusPageData,
      {
        status: 200, // Return 200 even on error so status page stays up
        headers: {
          'Cache-Control': 'public, max-age=10, s-maxage=10',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
