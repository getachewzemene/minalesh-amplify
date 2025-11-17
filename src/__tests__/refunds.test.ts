import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initiateRefund, processRefund, getRefundableAmount } from '@/lib/refund';
import prisma from '@/lib/prisma';

// Mock Stripe
vi.mock('stripe', () => {
  const mockRefunds = {
    create: vi.fn().mockResolvedValue({
      id: 're_test123',
      status: 'succeeded',
      amount: 50000,
    }),
  };
  
  return {
    default: vi.fn().mockImplementation(() => ({
      refunds: mockRefunds,
    })),
  };
});

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refund: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $executeRawUnsafe: vi.fn(),
    orderEvent: {
      create: vi.fn(),
    },
  },
}));

describe('Refund System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateRefund', () => {
    it('should successfully initiate a full refund', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'completed',
        paymentMethod: 'stripe',
        orderItems: [
          {
            id: 'item-1',
            productId: 'prod-1',
            variantId: null,
            quantity: 2,
            product: { id: 'prod-1', stockQuantity: 10 },
            variant: null,
          },
        ],
        refunds: [],
      };

      const mockRefund = {
        id: 'refund-123',
        orderId: 'order-123',
        amount: 1000,
        status: 'pending',
        provider: 'stripe',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback) => {
          if (typeof callback === 'function') {
            return callback(prisma);
          }
          return mockRefund as never;
        }
      );
      vi.mocked(prisma.refund.create).mockResolvedValue(mockRefund as never);

      const result = await initiateRefund({
        orderId: 'order-123',
        amount: 1000,
        reason: 'Customer request',
        restoreStock: true,
      });

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund-123');
    });

    it('should reject refund for non-completed payment', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        orderItems: [],
        refunds: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const result = await initiateRefund({
        orderId: 'order-123',
        amount: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order payment not completed');
    });

    it('should reject refund exceeding order total', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'completed',
        orderItems: [],
        refunds: [
          { status: 'completed', amount: 800 },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const result = await initiateRefund({
        orderId: 'order-123',
        amount: 300,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds order total');
    });

    it('should support partial refunds', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'completed',
        paymentMethod: 'stripe',
        orderItems: [
          {
            id: 'item-1',
            productId: 'prod-1',
            variantId: null,
            quantity: 2,
            product: { id: 'prod-1', stockQuantity: 10 },
            variant: null,
          },
        ],
        refunds: [],
      };

      const mockRefund = {
        id: 'refund-123',
        orderId: 'order-123',
        amount: 500,
        status: 'pending',
        provider: 'stripe',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);
      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback) => {
          if (typeof callback === 'function') {
            return callback(prisma);
          }
          return mockRefund as never;
        }
      );
      vi.mocked(prisma.refund.create).mockResolvedValue(mockRefund as never);

      const result = await initiateRefund({
        orderId: 'order-123',
        amount: 500,
        reason: 'Partial refund',
      });

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund-123');
    });
  });

  describe('processRefund', () => {
    it('should process Stripe refund successfully', async () => {
      const mockRefund = {
        id: 'refund-123',
        orderId: 'order-123',
        amount: 1000,
        provider: 'stripe',
        order: {
          id: 'order-123',
          stripeSessionId: 'pi_test123',
          totalAmount: 1000,
          orderNumber: 'ORDER-123',
        },
      };

      const mockUpdatedRefund = {
        ...mockRefund,
        status: 'completed',
        providerRefundId: 're_test123',
      };

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never);
      vi.mocked(prisma.refund.update).mockResolvedValue(mockUpdatedRefund as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockRefund.order,
        refunds: [mockUpdatedRefund],
      } as never);

      const result = await processRefund('refund-123');

      expect(result).toBe(true);
    });

    it('should handle manual refunds (COD)', async () => {
      const mockRefund = {
        id: 'refund-123',
        orderId: 'order-123',
        amount: 1000,
        provider: 'cod',
        order: {
          id: 'order-123',
          totalAmount: 1000,
          orderNumber: 'ORDER-123',
        },
      };

      vi.mocked(prisma.refund.findUnique).mockResolvedValue(mockRefund as never);
      vi.mocked(prisma.refund.update).mockResolvedValue({
        ...mockRefund,
        status: 'completed',
      } as never);

      const result = await processRefund('refund-123');

      expect(result).toBe(true);
    });
  });

  describe('getRefundableAmount', () => {
    it('should calculate correct refundable amount', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        refunds: [
          { status: 'completed', amount: 300 },
          { status: 'completed', amount: 200 },
          { status: 'pending', amount: 100 }, // Should not count
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const amount = await getRefundableAmount('order-123');

      expect(amount).toBe(500); // 1000 - 300 - 200
    });

    it('should return 0 for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const amount = await getRefundableAmount('non-existent');

      expect(amount).toBe(0);
    });

    it('should return 0 when fully refunded', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        refunds: [
          { status: 'completed', amount: 1000 },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const amount = await getRefundableAmount('order-123');

      expect(amount).toBe(0);
    });
  });
});
