/**
 * Database Health Check Utility
 * 
 * Provides functions to check database connectivity, connection pool status,
 * and overall database health for monitoring and alerting.
 */

import prisma from './prisma'
import logger from './logger'

/**
 * Configuration constants for connection pool monitoring
 */
const CONNECTION_POOL_THRESHOLDS = {
  MAX_WAITING_CLIENTS: 10,
  MIN_IDLE_CONNECTIONS: 0,
  MAX_WAIT_TIME_MICROSECONDS: 1000000, // 1 second
} as const

/**
 * Maximum limits for query result sizes
 */
const QUERY_LIMITS = {
  MAX_SLOW_QUERIES: 100,
  MAX_TABLE_SIZES: 100,
} as const

/**
 * Check if database is accessible
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`
    
    const latency = Date.now() - startTime
    
    return {
      connected: true,
      latency,
    }
  } catch (error) {
    logger.error('Database connection check failed', { error })
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  tableCount?: number
  userCount?: number
  productCount?: number
  orderCount?: number
  size?: string
  error?: string
}> {
  try {
    // Get basic counts
    const [userCount, productCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
    ])
    
    // Get database size
    const sizeResult = await prisma.$queryRaw<Array<{ database_size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `
    
    // Get table count
    const tableCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `
    
    return {
      tableCount: Number(tableCountResult[0]?.count ?? 0),
      userCount,
      productCount,
      orderCount,
      size: sizeResult[0]?.database_size ?? 'unknown',
    }
  } catch (error) {
    logger.error('Failed to get database stats', { error })
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get connection pool statistics (if using PgBouncer)
 */
export async function getConnectionPoolStats(): Promise<{
  pools?: Array<{
    database: string
    user: string
    cl_active: number
    cl_waiting: number
    sv_active: number
    sv_idle: number
    sv_used: number
    maxwait: number
  }>
  error?: string
}> {
  try {
    // This query works with PgBouncer
    // For direct PostgreSQL connections, this will fail gracefully
    const pools = await prisma.$queryRawUnsafe<Array<{
      database: string
      user: string
      cl_active: number
      cl_waiting: number
      sv_active: number
      sv_idle: number
      sv_used: number
      maxwait: number
    }>>('SHOW POOLS')
    
    return { pools }
  } catch (error) {
    // Not using PgBouncer or direct connection
    // This is not necessarily an error, so we just log as debug
    logger.debug('Could not get connection pool stats (not using PgBouncer?)', { error })
    return {
      error: 'Connection pool stats not available',
    }
  }
}

/**
 * Get PostgreSQL server statistics
 */
export async function getServerStats(): Promise<{
  version?: string
  uptime?: string
  connections?: {
    total: number
    active: number
    idle: number
  }
  error?: string
}> {
  try {
    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `
    
    // Get server uptime
    const uptimeResult = await prisma.$queryRaw<Array<{ uptime: string }>>`
      SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
    `
    
    // Get connection counts
    const connectionResult = await prisma.$queryRaw<Array<{
      total: bigint
      active: bigint
      idle: bigint
    }>>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
    `
    
    return {
      version: versionResult[0]?.version ?? 'unknown',
      uptime: uptimeResult[0]?.uptime ?? 'unknown',
      connections: {
        total: Number(connectionResult[0]?.total ?? 0),
        active: Number(connectionResult[0]?.active ?? 0),
        idle: Number(connectionResult[0]?.idle ?? 0),
      },
    }
  } catch (error) {
    logger.error('Failed to get server stats', { error })
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get slow query information
 * Note: Requires pg_stat_statements extension
 */
export async function getSlowQueries(
  limit: number = 10
): Promise<{
  queries?: Array<{
    query: string
    calls: bigint
    mean_time: number
    total_time: number
  }>
  error?: string
}> {
  try {
    // Validate and sanitize limit
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), QUERY_LIMITS.MAX_SLOW_QUERIES)
    
    const queries = await prisma.$queryRaw<Array<{
      query: string
      calls: bigint
      mean_time: number
      total_time: number
    }>>`
      SELECT 
        query,
        calls,
        mean_exec_time as mean_time,
        total_exec_time as total_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT ${safeLimit}
    `
    
    return { queries }
  } catch (error) {
    // pg_stat_statements extension not available
    logger.debug('Could not get slow queries (pg_stat_statements not enabled?)', { error })
    return {
      error: 'Slow query stats not available (enable pg_stat_statements extension)',
    }
  }
}

/**
 * Get table size information
 */
export async function getTableSizes(limit: number = 20): Promise<{
  tables?: Array<{
    table_name: string
    total_size: string
    table_size: string
    indexes_size: string
  }>
  error?: string
}> {
  try {
    // Validate and sanitize limit
    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), QUERY_LIMITS.MAX_TABLE_SIZES)
    
    const tables = await prisma.$queryRaw<Array<{
      table_name: string
      total_size: string
      table_size: string
      indexes_size: string
    }>>`
      SELECT
        tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT ${safeLimit}
    `
    
    return { tables }
  } catch (error) {
    logger.error('Failed to get table sizes', { error })
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get index usage statistics
 */
export async function getUnusedIndexes(): Promise<{
  indexes?: Array<{
    schema: string
    table: string
    index: string
    index_scans: bigint
    size: string
  }>
  error?: string
}> {
  try {
    const indexes = await prisma.$queryRaw<Array<{
      schema: string
      table: string
      index: string
      index_scans: bigint
      size: string
    }>>`
      SELECT
        schemaname as schema,
        tablename as table,
        indexname as index,
        idx_scan as index_scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexrelid) DESC
    `
    
    return { indexes }
  } catch (error) {
    logger.error('Failed to get unused indexes', { error })
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Comprehensive health check
 */
export async function getHealthCheck(): Promise<{
  healthy: boolean
  timestamp: string
  database: {
    connected: boolean
    latency?: number
    error?: string
  }
  stats?: {
    tableCount?: number
    userCount?: number
    productCount?: number
    orderCount?: number
    size?: string
  }
  server?: {
    version?: string
    uptime?: string
    connections?: {
      total: number
      active: number
      idle: number
    }
  }
  connectionPool?: {
    available: boolean
    stats?: Array<{
      database: string
      user: string
      cl_active: number
      cl_waiting: number
      sv_active: number
      sv_idle: number
      sv_used: number
      maxwait: number
    }>
  }
}> {
  const timestamp = new Date().toISOString()
  
  // Check database connection
  const dbConnection = await checkDatabaseConnection()
  
  if (!dbConnection.connected) {
    return {
      healthy: false,
      timestamp,
      database: dbConnection,
    }
  }
  
  // Get additional stats
  const [stats, serverStats, poolStats] = await Promise.all([
    getDatabaseStats(),
    getServerStats(),
    getConnectionPoolStats(),
  ])
  
  return {
    healthy: true,
    timestamp,
    database: dbConnection,
    stats: stats.error ? undefined : stats,
    server: serverStats.error ? undefined : serverStats,
    connectionPool: {
      available: !poolStats.error,
      stats: poolStats.pools,
    },
  }
}

/**
 * Check if database connection is healthy (throws error if not)
 * Useful for startup checks
 */
export async function assertDatabaseHealthy(): Promise<void> {
  const health = await getHealthCheck()
  
  if (!health.healthy) {
    throw new Error(
      `Database health check failed: ${health.database.error ?? 'Unknown error'}`
    )
  }
  
  logger.info('Database health check passed', {
    latency: health.database.latency,
    version: health.server?.version,
  })
}

/**
 * Monitor connection pool for alerts
 * Returns true if pool usage is concerning
 */
export function isConnectionPoolWarning(poolStats: {
  cl_active: number
  cl_waiting: number
  sv_active: number
  sv_idle: number
  sv_used: number
  maxwait?: number
}): {
  warning: boolean
  reason?: string
} {
  // High client waiting queue
  if (poolStats.cl_waiting > CONNECTION_POOL_THRESHOLDS.MAX_WAITING_CLIENTS) {
    return {
      warning: true,
      reason: `${poolStats.cl_waiting} clients waiting for connections`,
    }
  }
  
  // Low idle connections
  if (poolStats.sv_idle === CONNECTION_POOL_THRESHOLDS.MIN_IDLE_CONNECTIONS && poolStats.sv_used > 0) {
    return {
      warning: true,
      reason: 'No idle server connections available',
    }
  }
  
  // High maxwait time (in microseconds)
  if (poolStats.maxwait && poolStats.maxwait > CONNECTION_POOL_THRESHOLDS.MAX_WAIT_TIME_MICROSECONDS) {
    return {
      warning: true,
      reason: `Maximum wait time is ${poolStats.maxwait / CONNECTION_POOL_THRESHOLDS.MAX_WAIT_TIME_MICROSECONDS}s`,
    }
  }
  
  return { warning: false }
}
