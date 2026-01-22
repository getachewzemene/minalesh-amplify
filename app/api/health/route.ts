/**
 * Health Check API
 * Comprehensive endpoint for uptime monitoring services (UptimeRobot, Pingdom, etc.)
 * and load balancer health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getConfigSummary } from '@/lib/env';
import { checkDatabaseConnection } from '@/lib/database-health';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: boolean;
      latency?: number;
    };
    cache?: {
      status: boolean;
      latency?: number;
    };
    uptime: number;
  };
  config?: ReturnType<typeof getConfigSummary>;
}

const startTime = Date.now();

/**
 * GET /api/health
 * Returns health status of the application
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get('detailed') === 'true';

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: {
        status: false,
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  };

  try {
    // Check database connection with latency measurement
    const dbHealth = await checkDatabaseConnection();
    health.checks.database = {
      status: dbHealth.connected,
      latency: dbHealth.latency,
    };
    
    if (!dbHealth.connected) {
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.checks.database = {
      status: false,
    };
    health.status = 'unhealthy';
  }

  // Check Redis/cache if available
  try {
    const { getRedisClient } = await import('@/lib/redis');
    const redis = getRedisClient();
    
    if (redis) {
      const redisStart = Date.now();
      await redis.ping();
      const redisLatency = Date.now() - redisStart;
      
      health.checks.cache = {
        status: true,
        latency: redisLatency,
      };
    }
  } catch (error) {
    // Redis is optional, mark as degraded if it fails
    health.checks.cache = {
      status: false,
    };
    
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  // Add more detailed info if requested (admin only in production)
  if (detailed) {
    const memUsage = process.memoryUsage();
    const additionalInfo = {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      memoryUsage: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
      },
      cpuUsage: process.cpuUsage(),
    };

    // Add configuration summary
    const configSummary = getConfigSummary();

    return NextResponse.json({
      ...health,
      config: configSummary,
      details: additionalInfo,
    }, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * HEAD /api/health
 * Lightweight health check - only returns HTTP status code
 * Perfect for simple uptime monitoring
 */
export async function HEAD(req: NextRequest) {
  try {
    const dbHealth = await checkDatabaseConnection();
    
    if (dbHealth.connected) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
