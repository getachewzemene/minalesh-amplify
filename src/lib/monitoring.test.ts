/**
 * Monitoring Library Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('./prisma', () => ({
  default: {
    systemHealthMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    alertConfig: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    alertHistory: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    webhookEvent: {
      count: vi.fn(),
    },
    emailQueue: {
      count: vi.fn(),
    },
    cronJobExecution: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('./database-health', () => ({
  checkDatabaseConnection: vi.fn(() => Promise.resolve({
    connected: true,
    latency: 50,
  })),
}));

vi.mock('./email', () => ({
  sendEmailImmediate: vi.fn(() => Promise.resolve(true)),
}));

describe('Monitoring Library', () => {
  describe('recordHealthMetric', () => {
    it('should record a health metric with healthy status', async () => {
      const { recordHealthMetric } = await import('./monitoring');
      const prisma = (await import('./prisma')).default;

      (prisma.systemHealthMetric.create as any).mockResolvedValue({
        id: 'test-id',
        metricType: 'memory_heap_used_mb',
        metricValue: 256,
        metricUnit: 'MB',
        status: 'healthy',
        recordedAt: new Date(),
      });

      const metric = await recordHealthMetric('memory_heap_used_mb', 256, {
        unit: 'MB',
        threshold: 512,
      });

      expect(metric).toMatchObject({
        type: 'memory_heap_used_mb',
        value: 256,
        unit: 'MB',
        status: 'healthy',
      });
    });

    it('should record a metric with warning status when near threshold', async () => {
      const { recordHealthMetric } = await import('./monitoring');
      const prisma = (await import('./prisma')).default;

      (prisma.systemHealthMetric.create as any).mockResolvedValue({
        id: 'test-id',
        metricType: 'memory_heap_used_mb',
        metricValue: 450,
        metricUnit: 'MB',
        status: 'warning',
        recordedAt: new Date(),
      });

      const metric = await recordHealthMetric('memory_heap_used_mb', 450, {
        unit: 'MB',
        threshold: 512,
      });

      expect(metric.status).toBe('warning');
    });

    it('should record a metric with critical status when exceeding threshold', async () => {
      const { recordHealthMetric } = await import('./monitoring');
      const prisma = (await import('./prisma')).default;

      (prisma.systemHealthMetric.create as any).mockResolvedValue({
        id: 'test-id',
        metricType: 'memory_heap_used_mb',
        metricValue: 600,
        metricUnit: 'MB',
        status: 'critical',
        recordedAt: new Date(),
      });

      const metric = await recordHealthMetric('memory_heap_used_mb', 600, {
        unit: 'MB',
        threshold: 512,
      });

      expect(metric.status).toBe('critical');
    });
  });

  describe('getAPMProvider', () => {
    it('should detect New Relic when license key is set', async () => {
      process.env.NEW_RELIC_LICENSE_KEY = 'test-key';
      delete process.env.DATADOG_API_KEY;
      delete process.env.SENTRY_DSN;

      const { getAPMProvider } = await import('./apm');
      expect(getAPMProvider()).toBe('newrelic');
      
      delete process.env.NEW_RELIC_LICENSE_KEY;
    });

    it('should detect Datadog when API key is set', async () => {
      delete process.env.NEW_RELIC_LICENSE_KEY;
      process.env.DATADOG_API_KEY = 'test-key';
      delete process.env.SENTRY_DSN;

      const { getAPMProvider } = await import('./apm');
      expect(getAPMProvider()).toBe('datadog');
      
      delete process.env.DATADOG_API_KEY;
    });

    it('should return none when no APM is configured', async () => {
      delete process.env.NEW_RELIC_LICENSE_KEY;
      delete process.env.DATADOG_API_KEY;
      delete process.env.SENTRY_DSN;

      const { getAPMProvider } = await import('./apm');
      expect(getAPMProvider()).toBe('none');
    });
  });
});
