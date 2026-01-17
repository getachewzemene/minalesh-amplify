/**
 * Health Check API
 * Simple endpoint for monitoring and load balancer health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getConfigSummary } from '@/lib/env';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    cache?: boolean;
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
      database: false,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
  } catch {
    health.checks.database = false;
    health.status = 'unhealthy';
  }

  // Add more detailed info if requested (admin only in production)
  if (detailed) {
    const additionalInfo = {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    };

    // Add configuration summary
    const configSummary = getConfigSummary();

    return NextResponse.json({
      ...health,
      config: configSummary,
      details: additionalInfo,
    }, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
  });
}
