/**
 * Buyer Protection Tests
 *
 * Tests for the buyer protection program including:
 * - Protection fee calculation
 * - Claim eligibility
 * - Claim filing
 * - Auto-refund SLA violations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    buyerProtectionSettings: {
      findFirst: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    protectionClaim: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    refund: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      refund: {
        create: vi.fn(),
      },
      product: {
        update: vi.fn(),
      },
      productVariant: {
        update: vi.fn(),
      },
    })),
  },
}));

// Mock refund module
vi.mock('@/lib/refund', () => ({
  initiateRefund: vi.fn().mockResolvedValue({ success: true, refundId: 'refund-123' }),
  processRefund: vi.fn().mockResolvedValue(true),
}));

import {
  getProtectionSettings,
  calculateProtectionFee,
  isEligibleForClaim,
  fileProtectionClaim,
} from '@/lib/buyer-protection';
import prisma from '@/lib/prisma';

describe('Buyer Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProtectionSettings', () => {
    it('should return default settings when no settings in database', async () => {
      vi.mocked(prisma.buyerProtectionSettings.findFirst).mockResolvedValue(null);

      const settings = await getProtectionSettings();

      expect(settings).toEqual({
        protectionFeePercent: 2.5,
        protectionPeriodDays: 30,
        vendorShippingSLAHours: 72,
        insuranceThresholdAmount: 5000,
        insuranceFeePercent: 1.5,
        isEnabled: true,
      });
    });

    it('should return database settings when available', async () => {
      vi.mocked(prisma.buyerProtectionSettings.findFirst).mockResolvedValue({
        id: 'settings-1',
        protectionFeePercent: 3 as any,
        protectionPeriodDays: 45,
        vendorShippingSLAHours: 48,
        insuranceThresholdAmount: 10000 as any,
        insuranceFeePercent: 2 as any,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const settings = await getProtectionSettings();

      expect(settings.protectionFeePercent).toBe(3);
      expect(settings.protectionPeriodDays).toBe(45);
      expect(settings.vendorShippingSLAHours).toBe(48);
    });
  });

  describe('calculateProtectionFee', () => {
    beforeEach(() => {
      vi.mocked(prisma.buyerProtectionSettings.findFirst).mockResolvedValue(null);
    });

    it('should return zero fees when protection is disabled', async () => {
      const result = await calculateProtectionFee(1000, false, false);

      expect(result.protectionFee).toBe(0);
      expect(result.insuranceFee).toBe(0);
      expect(result.totalFee).toBe(0);
    });

    it('should calculate protection fee correctly', async () => {
      const result = await calculateProtectionFee(1000, true, false);

      expect(result.protectionFee).toBe(25); // 2.5% of 1000
      expect(result.insuranceFee).toBe(0);
      expect(result.totalFee).toBe(25);
      expect(result.isHighValue).toBe(false);
    });

    it('should add insurance fee for high-value orders', async () => {
      const result = await calculateProtectionFee(10000, true, true);

      expect(result.protectionFee).toBe(250); // 2.5% of 10000
      expect(result.insuranceFee).toBe(150); // 1.5% of 10000
      expect(result.totalFee).toBe(400);
      expect(result.isHighValue).toBe(true);
    });

    it('should auto-enable insurance for high-value orders when not explicitly disabled', async () => {
      const result = await calculateProtectionFee(6000, true, undefined);

      expect(result.isHighValue).toBe(true);
      expect(result.insuranceFee).toBe(90); // 1.5% of 6000
    });

    it('should not add insurance for low-value orders even if requested', async () => {
      const result = await calculateProtectionFee(1000, true, true);

      expect(result.isHighValue).toBe(false);
      expect(result.insuranceFee).toBe(0);
    });

    it('should calculate shipping deadline', async () => {
      const result = await calculateProtectionFee(1000, true, false);

      const expectedDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const actualDeadline = result.shippingDeadline;

      // Allow 1 second tolerance
      expect(Math.abs(actualDeadline.getTime() - expectedDeadline.getTime())).toBeLessThan(1000);
    });
  });

  describe('isEligibleForClaim', () => {
    it('should return ineligible if order not found', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Order not found');
    });

    it('should return ineligible if buyer protection was not enabled', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: false,
        protectionExpiresAt: null,
        status: 'delivered',
        protectionClaims: [],
      } as any);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Buyer protection was not enabled for this order');
    });

    it('should return ineligible if there is already an active claim', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: true,
        protectionExpiresAt: new Date(Date.now() + 86400000),
        status: 'delivered',
        protectionClaims: [{ id: 'claim-1', status: 'pending' }],
      } as any);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('An active protection claim already exists for this order');
    });

    it('should return ineligible if protection has expired', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: true,
        protectionExpiresAt: new Date(Date.now() - 86400000), // Yesterday
        status: 'delivered',
        protectionClaims: [],
      } as any);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Protection period has expired');
    });

    it('should return ineligible if order is already cancelled or refunded', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: true,
        protectionExpiresAt: new Date(Date.now() + 86400000),
        status: 'cancelled',
        protectionClaims: [],
      } as any);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Order is already cancelled or refunded');
    });

    it('should return eligible for valid protected order', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: true,
        protectionExpiresAt: new Date(Date.now() + 86400000),
        status: 'delivered',
        protectionClaims: [],
      } as any);

      const result = await isEligibleForClaim('order-123', 'user-123');

      expect(result.eligible).toBe(true);
    });
  });

  describe('fileProtectionClaim', () => {
    it('should file a claim successfully', async () => {
      // Mock eligibility check
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: true,
        protectionExpiresAt: new Date(Date.now() + 86400000),
        status: 'delivered',
        protectionClaims: [],
      } as any);

      // Mock order lookup for total amount (total 1000, protection fee 25)
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        totalAmount: 1000 as any,
        protectionFee: 25 as any,
      } as any);

      // Mock claim creation (refund amount should be 1000 - 25 = 975)
      vi.mocked(prisma.protectionClaim.create).mockResolvedValue({
        id: 'claim-123',
        orderId: 'order-123',
        userId: 'user-123',
        claimType: 'not_received',
        status: 'pending',
        description: 'I did not receive my order',
        evidenceUrls: [],
        requestedRefundAmount: 975 as any,
        approvedRefundAmount: null,
        refundTransactionId: null,
        resolution: null,
        reviewedBy: null,
        reviewedAt: null,
        refundedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await fileProtectionClaim({
        orderId: 'order-123',
        userId: 'user-123',
        claimType: 'not_received',
        description: 'I did not receive my order',
      });

      expect(result.success).toBe(true);
      expect(result.claimId).toBe('claim-123');
    });

    it('should reject claim if order is not eligible', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({
        id: 'order-123',
        buyerProtectionEnabled: false,
        protectionExpiresAt: null,
        status: 'delivered',
        protectionClaims: [],
      } as any);

      const result = await fileProtectionClaim({
        orderId: 'order-123',
        userId: 'user-123',
        claimType: 'not_received',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buyer protection was not enabled for this order');
    });
  });
});
