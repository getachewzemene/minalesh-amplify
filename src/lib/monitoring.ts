/**
 * Enhanced Monitoring Service
 * System health monitoring, alerts, and metrics collection
 */

import prisma from './prisma';
import { subHours, subDays, startOfDay } from 'date-fns';
import os from 'os';
import { checkDatabaseConnection } from './database-health';

export interface HealthMetric {
  type: string;
  value: number;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

export interface AlertTrigger {
  alertConfigId: string;
  metricValue: number;
  threshold: number;
  severity: string;
  message: string;
}

/**
 * Record a system health metric
 */
export async function recordHealthMetric(
  metricType: string,
  metricValue: number,
  options?: {
    unit?: string;
    threshold?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<HealthMetric> {
  // Determine status based on threshold or default rules
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (options?.threshold) {
    const ratio = metricValue / options.threshold;
    if (ratio >= 1) status = 'critical';
    else if (ratio >= 0.8) status = 'warning';
  }

  const metric = await prisma.systemHealthMetric.create({
    data: {
      metricType,
      metricValue,
      metricUnit: options?.unit,
      threshold: options?.threshold,
      status,
      metadata: options?.metadata,
    },
  });

  return {
    type: metric.metricType,
    value: metric.metricValue,
    unit: metric.metricUnit || undefined,
    status: metric.status as 'healthy' | 'warning' | 'critical',
    timestamp: metric.recordedAt,
  };
}

/**
 * Get recent health metrics
 */
export async function getRecentHealthMetrics(
  metricType?: string,
  hours: number = 24
) {
  const since = subHours(new Date(), hours);

  const metrics = await prisma.systemHealthMetric.findMany({
    where: {
      ...(metricType && { metricType }),
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: 'desc' },
    take: 1000,
  });

  return metrics;
}

/**
 * Get health metric summary
 */
export async function getHealthMetricSummary(hours: number = 24) {
  const since = subHours(new Date(), hours);

  const metrics = await prisma.systemHealthMetric.groupBy({
    by: ['metricType', 'status'],
    where: { recordedAt: { gte: since } },
    _count: true,
    _avg: { metricValue: true },
    _max: { metricValue: true },
    _min: { metricValue: true },
  });

  // Group by metric type
  const summary: Record<string, {
    avgValue: number;
    maxValue: number;
    minValue: number;
    healthyCounts: number;
    warningCounts: number;
    criticalCounts: number;
    currentStatus: 'healthy' | 'warning' | 'critical';
  }> = {};

  metrics.forEach((m) => {
    if (!summary[m.metricType]) {
      summary[m.metricType] = {
        avgValue: 0,
        maxValue: 0,
        minValue: Infinity,
        healthyCounts: 0,
        warningCounts: 0,
        criticalCounts: 0,
        currentStatus: 'healthy',
      };
    }

    const s = summary[m.metricType];
    s.avgValue = (s.avgValue + (m._avg.metricValue || 0)) / 2;
    s.maxValue = Math.max(s.maxValue, m._max.metricValue || 0);
    s.minValue = Math.min(s.minValue, m._min.metricValue || Infinity);

    if (m.status === 'healthy') s.healthyCounts += m._count;
    else if (m.status === 'warning') {
      s.warningCounts += m._count;
      if (s.currentStatus !== 'critical') s.currentStatus = 'warning';
    } else if (m.status === 'critical') {
      s.criticalCounts += m._count;
      s.currentStatus = 'critical';
    }
  });

  return summary;
}

/**
 * Create an alert configuration
 */
export async function createAlertConfig(config: {
  name: string;
  description?: string;
  metricType: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity?: 'info' | 'warning' | 'critical';
  cooldownMinutes?: number;
  notifyEmail?: boolean;
  notifySlack?: boolean;
  webhookUrl?: string;
}) {
  return prisma.alertConfig.create({
    data: {
      name: config.name,
      description: config.description,
      metricType: config.metricType,
      condition: config.condition,
      threshold: config.threshold,
      severity: config.severity || 'warning',
      cooldownMinutes: config.cooldownMinutes || 15,
      notifyEmail: config.notifyEmail ?? true,
      notifySlack: config.notifySlack ?? false,
      webhookUrl: config.webhookUrl,
    },
  });
}

/**
 * Get all alert configurations
 */
export async function getAlertConfigs() {
  return prisma.alertConfig.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { alerts: true },
      },
    },
  });
}

/**
 * Update alert configuration
 */
export async function updateAlertConfig(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    threshold: number;
    severity: string;
    isEnabled: boolean;
    cooldownMinutes: number;
    notifyEmail: boolean;
    notifySlack: boolean;
    webhookUrl: string;
  }>
) {
  return prisma.alertConfig.update({
    where: { id },
    data: updates,
  });
}

/**
 * Delete alert configuration
 */
export async function deleteAlertConfig(id: string) {
  return prisma.alertConfig.delete({
    where: { id },
  });
}

/**
 * Check metrics against alert configurations and trigger alerts
 */
export async function checkAndTriggerAlerts(
  metricType: string,
  metricValue: number
): Promise<AlertTrigger[]> {
  const now = new Date();
  const triggers: AlertTrigger[] = [];

  // Get active alert configs for this metric type
  const configs = await prisma.alertConfig.findMany({
    where: {
      metricType,
      isEnabled: true,
    },
  });

  for (const config of configs) {
    // Check cooldown
    if (config.lastTriggeredAt) {
      const cooldownEnd = new Date(
        config.lastTriggeredAt.getTime() + config.cooldownMinutes * 60 * 1000
      );
      if (now < cooldownEnd) continue;
    }

    // Check condition
    let shouldTrigger = false;
    switch (config.condition) {
      case 'gt':
        shouldTrigger = metricValue > config.threshold;
        break;
      case 'lt':
        shouldTrigger = metricValue < config.threshold;
        break;
      case 'eq':
        shouldTrigger = metricValue === config.threshold;
        break;
      case 'gte':
        shouldTrigger = metricValue >= config.threshold;
        break;
      case 'lte':
        shouldTrigger = metricValue <= config.threshold;
        break;
    }

    if (shouldTrigger) {
      const message = `Alert: ${config.name} - ${metricType} is ${metricValue} (threshold: ${config.threshold})`;

      // Create alert history record
      await prisma.alertHistory.create({
        data: {
          alertConfigId: config.id,
          metricValue,
          threshold: config.threshold,
          severity: config.severity,
          message,
        },
      });

      // Update last triggered time
      await prisma.alertConfig.update({
        where: { id: config.id },
        data: { lastTriggeredAt: now },
      });

      triggers.push({
        alertConfigId: config.id,
        metricValue,
        threshold: config.threshold,
        severity: config.severity,
        message,
      });

      // TODO: Send notifications based on config
      // if (config.notifyEmail) await sendAlertEmail(message);
      // if (config.notifySlack) await sendSlackNotification(message);
      // if (config.webhookUrl) await callWebhook(config.webhookUrl, trigger);
    }
  }

  return triggers;
}

/**
 * Get alert history
 */
export async function getAlertHistory(
  filters?: {
    alertConfigId?: string;
    severity?: string;
    acknowledged?: boolean;
    days?: number;
  },
  limit: number = 100
) {
  const since = filters?.days ? subDays(new Date(), filters.days) : undefined;

  return prisma.alertHistory.findMany({
    where: {
      ...(filters?.alertConfigId && { alertConfigId: filters.alertConfigId }),
      ...(filters?.severity && { severity: filters.severity }),
      ...(filters?.acknowledged !== undefined && { acknowledged: filters.acknowledged }),
      ...(since && { createdAt: { gte: since } }),
    },
    include: {
      alertConfig: {
        select: { name: true, metricType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
) {
  return prisma.alertHistory.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy,
    },
  });
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string) {
  return prisma.alertHistory.update({
    where: { id: alertId },
    data: {
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get system health overview
 */
export async function getSystemHealthOverview() {
  const [metricSummary, activeAlerts, recentAlerts, cronJobs] = await Promise.all([
    getHealthMetricSummary(24),
    prisma.alertHistory.count({
      where: {
        acknowledged: false,
        resolvedAt: null,
        createdAt: { gte: subDays(new Date(), 1) },
      },
    }),
    getAlertHistory({ days: 7 }, 10),
    prisma.cronJobExecution.findMany({
      where: { startedAt: { gte: subDays(new Date(), 1) } },
      orderBy: { startedAt: 'desc' },
      take: 20,
    }),
  ]);

  // Determine overall system health
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  Object.values(metricSummary).forEach((m) => {
    if (m.currentStatus === 'critical') overallStatus = 'critical';
    else if (m.currentStatus === 'warning' && overallStatus !== 'critical') {
      overallStatus = 'warning';
    }
  });

  // Calculate cron job success rate
  const cronJobStats = {
    total: cronJobs.length,
    successful: cronJobs.filter((j) => j.status === 'success').length,
    failed: cronJobs.filter((j) => j.status === 'failed').length,
    successRate: cronJobs.length > 0
      ? (cronJobs.filter((j) => j.status === 'success').length / cronJobs.length) * 100
      : 100,
  };

  return {
    overallStatus,
    metrics: metricSummary,
    alerts: {
      active: activeAlerts,
      recent: recentAlerts,
    },
    cronJobs: {
      stats: cronJobStats,
      recent: cronJobs.slice(0, 5),
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get system memory usage metrics
 */
export async function collectMemoryMetrics(): Promise<HealthMetric[]> {
  const metrics: HealthMetric[] = [];
  
  // Process memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const rssMB = memUsage.rss / 1024 / 1024;
  
  metrics.push(await recordHealthMetric('memory_heap_used_mb', heapUsedMB, {
    unit: 'MB',
    threshold: 512,
  }));
  
  metrics.push(await recordHealthMetric('memory_heap_total_mb', heapTotalMB, {
    unit: 'MB',
    threshold: 1024,
  }));
  
  metrics.push(await recordHealthMetric('memory_rss_mb', rssMB, {
    unit: 'MB',
    threshold: 1024,
  }));
  
  // System memory
  const totalMemGB = os.totalmem() / 1024 / 1024 / 1024;
  const freeMemGB = os.freemem() / 1024 / 1024 / 1024;
  const usedMemPercent = ((totalMemGB - freeMemGB) / totalMemGB) * 100;
  
  metrics.push(await recordHealthMetric('system_memory_used_percent', usedMemPercent, {
    unit: '%',
    threshold: 85,
  }));
  
  return metrics;
}

/**
 * Get system disk usage metrics
 * Note: This is a basic implementation. For production, consider using a library like 'diskusage'
 */
export async function collectDiskMetrics(): Promise<HealthMetric[]> {
  const metrics: HealthMetric[] = [];
  
  try {
    // Use Node.js to check disk space (basic implementation for Unix-like systems)
    // In production, you might want to use a more robust library
    const { execSync } = require('child_process');
    
    try {
      // Try to get disk usage for the root filesystem
      const dfOutput = execSync('df -k / | tail -1').toString();
      const parts = dfOutput.split(/\s+/);
      
      if (parts.length >= 5) {
        const usedPercent = parseInt(parts[4].replace('%', ''), 10);
        
        metrics.push(await recordHealthMetric('disk_usage_percent', usedPercent, {
          unit: '%',
          threshold: 85,
        }));
      }
    } catch (err) {
      // Fallback: just record that we couldn't check disk
      console.warn('Could not check disk usage:', err);
    }
  } catch (error) {
    console.error('Error collecting disk metrics:', error);
  }
  
  return metrics;
}

/**
 * Get database performance metrics
 */
export async function collectDatabaseMetrics(): Promise<HealthMetric[]> {
  const metrics: HealthMetric[] = [];
  
  // Check database connection and latency
  const dbHealth = await checkDatabaseConnection();
  
  if (dbHealth.connected && dbHealth.latency) {
    metrics.push(await recordHealthMetric('db_latency_ms', dbHealth.latency, {
      unit: 'ms',
      threshold: 100,
    }));
  }
  
  // Count active database queries (if available)
  try {
    const activeConnections = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `;
    
    const count = Number(activeConnections[0]?.count ?? 0);
    metrics.push(await recordHealthMetric('db_active_connections', count, {
      threshold: 50,
    }));
  } catch (error) {
    console.warn('Could not query database active connections:', error);
  }
  
  return metrics;
}

/**
 * Get queue depth metrics for all queues
 */
export async function collectQueueMetrics(): Promise<HealthMetric[]> {
  const metrics: HealthMetric[] = [];
  const now = new Date();
  
  // Email queue
  const pendingEmails = await prisma.emailQueue.count({
    where: { status: 'pending' },
  });
  metrics.push(await recordHealthMetric('email_queue_depth', pendingEmails, {
    threshold: 100,
  }));
  
  // Failed emails (last 24 hours)
  const failedEmails = await prisma.emailQueue.count({
    where: {
      status: 'failed',
      createdAt: { gte: subHours(now, 24) },
    },
  });
  metrics.push(await recordHealthMetric('email_queue_failed_24h', failedEmails, {
    threshold: 50,
  }));
  
  // Webhook queue
  const pendingWebhooks = await prisma.webhookEvent.count({
    where: { status: 'pending' },
  });
  metrics.push(await recordHealthMetric('webhook_queue_depth', pendingWebhooks, {
    threshold: 50,
  }));
  
  return metrics;
}

/**
 * Collect and record application metrics
 * This should be called periodically (e.g., every minute) to track system health
 */
export async function collectApplicationMetrics() {
  const now = new Date();
  const metrics: HealthMetric[] = [];

  try {
    // Collect all metrics in parallel
    const [memoryMetrics, diskMetrics, dbMetrics, queueMetrics] = await Promise.all([
      collectMemoryMetrics(),
      collectDiskMetrics(),
      collectDatabaseMetrics(),
      collectQueueMetrics(),
    ]);
    
    metrics.push(...memoryMetrics, ...diskMetrics, ...dbMetrics, ...queueMetrics);

    // Error rate (based on recent webhook failures as proxy)
    const recentWebhooks = await prisma.webhookEvent.count({
      where: { createdAt: { gte: subHours(now, 1) } },
    });
    const failedWebhooks = await prisma.webhookEvent.count({
      where: {
        createdAt: { gte: subHours(now, 1) },
        status: { in: ['failed', 'error'] },
      },
    });
    const errorRate = recentWebhooks > 0 ? (failedWebhooks / recentWebhooks) * 100 : 0;
    metrics.push(await recordHealthMetric('error_rate_percent', errorRate, {
      unit: '%',
      threshold: 5,
    }));

    // Check alerts for each metric
    for (const metric of metrics) {
      await checkAndTriggerAlerts(metric.type, metric.value);
    }

    return metrics;
  } catch (error) {
    console.error('Error collecting application metrics:', error);
    throw error;
  }
}
