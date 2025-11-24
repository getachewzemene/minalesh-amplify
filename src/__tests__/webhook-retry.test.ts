/**
 * Tests for Webhook Retry Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { retryFailedWebhooks, getWebhookRetryStats } from '@/services/WebhookService';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    webhookEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logEvent: vi.fn(),
  logError: vi.fn(),
}));

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retryFailedWebhooks', () => {
    it('should return zero processed when no webhooks found', async () => {
      vi.mocked(prisma.webhookEvent.findMany).mockResolvedValue([]);

      const result = await retryFailedWebhooks(10);

      expect(result).toEqual({
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    });

    it('should process failed webhooks within retry limit', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          provider: 'stripe',
          eventId: 'evt_123',
          orderId: 'order-1',
          payload: { test: 'data' },
          signature: 'sig_123',
          signatureHash: 'hash_123',
          status: 'error',
          retryCount: 1,
          nextRetryAt: new Date(Date.now() - 1000),
          errorMessage: 'Connection timeout',
          archived: false,
          createdAt: new Date(),
          processedAt: null,
          ipAddress: '127.0.0.1',
          latencyMs: null,
        },
      ];

      vi.mocked(prisma.webhookEvent.findMany).mockResolvedValue(mockWebhooks);
      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(mockWebhooks[0]);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-001',
        paymentStatus: 'pending',
        userId: 'user-1',
        status: 'pending',
        paymentMethod: 'stripe',
        paymentReference: null,
        stripeSessionId: null,
        subtotal: 100,
        shippingAmount: 10,
        taxAmount: 5,
        discountAmount: 0,
        totalAmount: 115,
        currency: 'ETB',
        shippingAddress: null,
        billingAddress: null,
        notes: null,
        paidAt: null,
        confirmedAt: null,
        processingAt: null,
        fulfilledAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        refundedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        couponId: null,
        promotionIds: [],
        shippingZoneId: null,
        shippingMethodId: null,
      });
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue(mockWebhooks[0]);

      const result = await retryFailedWebhooks(10);

      expect(result.processed).toBe(1);
      expect(prisma.webhookEvent.findMany).toHaveBeenCalledWith({
        where: {
          status: 'error',
          retryCount: { lt: 5 },
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: expect.any(Date) } },
          ],
          archived: false,
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });
    });

    it('should handle batch size parameter', async () => {
      vi.mocked(prisma.webhookEvent.findMany).mockResolvedValue([]);

      await retryFailedWebhooks(5);

      expect(prisma.webhookEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('getWebhookRetryStats', () => {
    it('should return webhook statistics', async () => {
      vi.mocked(prisma.webhookEvent.count)
        .mockResolvedValueOnce(5) // pendingRetries
        .mockResolvedValueOnce(10) // failedWebhooks
        .mockResolvedValueOnce(20); // archivedWebhooks

      const stats = await getWebhookRetryStats();

      expect(stats).toEqual({
        pendingRetries: 5,
        failedWebhooks: 10,
        archivedWebhooks: 20,
      });

      expect(prisma.webhookEvent.count).toHaveBeenCalledTimes(3);
    });

    it('should query correct conditions for pending retries', async () => {
      vi.mocked(prisma.webhookEvent.count).mockResolvedValue(0);

      await getWebhookRetryStats();

      expect(prisma.webhookEvent.count).toHaveBeenNthCalledWith(1, {
        where: {
          status: 'error',
          retryCount: { lt: 5 },
          archived: false,
        },
      });
    });

    it('should query correct conditions for failed webhooks', async () => {
      vi.mocked(prisma.webhookEvent.count).mockResolvedValue(0);

      await getWebhookRetryStats();

      expect(prisma.webhookEvent.count).toHaveBeenNthCalledWith(2, {
        where: {
          status: 'error',
          archived: false,
        },
      });
    });

    it('should query correct conditions for archived webhooks', async () => {
      vi.mocked(prisma.webhookEvent.count).mockResolvedValue(0);

      await getWebhookRetryStats();

      expect(prisma.webhookEvent.count).toHaveBeenNthCalledWith(3, {
        where: {
          archived: true,
        },
      });
    });
  });
});
