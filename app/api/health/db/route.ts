/**
 * Database Health Check API
 * Provides detailed database connectivity and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getHealthCheck,
  getConnectionPoolStats,
  getServerStats,
  getTableSizes,
  isConnectionPoolWarning,
} from '@/lib/database-health'
import logger from '@/lib/logger'

/**
 * GET /api/health/db
 * Returns comprehensive database health status
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const detailed = searchParams.get('detailed') === 'true'

  try {
    // Get basic health check
    const health = await getHealthCheck()

    if (!health.healthy) {
      logger.warn('Database health check failed', health.database)
      return NextResponse.json(
        {
          status: 'unhealthy',
          ...health,
        },
        { status: 503 }
      )
    }

    // Basic response
    if (!detailed) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: health.timestamp,
        database: {
          connected: health.database.connected,
          latency: health.database.latency,
        },
        stats: health.stats,
      })
    }

    // Detailed response with additional metrics
    const [poolStats, serverStats, tableSizes] = await Promise.all([
      getConnectionPoolStats(),
      getServerStats(),
      getTableSizes(10),
    ])

    // Check for connection pool warnings
    const poolWarnings: Array<{ database: string; reason: string }> = []
    if (poolStats.pools) {
      for (const pool of poolStats.pools) {
        const warning = isConnectionPoolWarning(pool)
        if (warning.warning) {
          poolWarnings.push({
            database: pool.database,
            reason: warning.reason!,
          })
        }
      }
    }

    const response = {
      status: 'healthy',
      timestamp: health.timestamp,
      database: health.database,
      stats: health.stats,
      server: serverStats.error ? { error: serverStats.error } : serverStats,
      connectionPool: {
        available: !poolStats.error,
        stats: poolStats.pools,
        warnings: poolWarnings.length > 0 ? poolWarnings : undefined,
      },
      tables: tableSizes.error ? { error: tableSizes.error } : { top10: tableSizes.tables },
    }

    // Log warnings if any
    if (poolWarnings.length > 0) {
      logger.warn('Connection pool warnings detected', { warnings: poolWarnings })
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Database health check error', { error })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

/**
 * HEAD /api/health/db
 * Simple connectivity check for monitoring tools
 */
export async function HEAD() {
  try {
    const health = await getHealthCheck()
    return new NextResponse(null, {
      status: health.healthy ? 200 : 503,
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
