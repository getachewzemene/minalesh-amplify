import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '@/lib/prisma';

// Mock environment
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

// Mock Stripe
vi.mock('stripe', () => {
  const mockPaymentIntents = {
    capture: vi.fn().mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
      amount: 100000,
    }),
  };
  
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: mockPaymentIntents,
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
    orderEvent: {
      create: vi.fn(),
    },
  },
}));

// Import capture functions after mocks are set up
const { capturePayment, getCaptureStatus } = await import('@/lib/capture');

describe('Payment Capture System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('capturePayment', () => {
    it('should successfully capture full payment', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORDER-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'completed',
      } as never);
      vi.mocked(prisma.orderEvent.create).mockResolvedValue({} as never);

      const result = await capturePayment({
        orderId: 'order-123',
      });

      expect(result.success).toBe(true);
      expect(result.captureId).toBe('pi_test123');
      expect(result.capturedAmount).toBe(1000);
    });

    it('should successfully capture partial payment', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORDER-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'completed',
      } as never);
      vi.mocked(prisma.orderEvent.create).mockResolvedValue({} as never);

      const result = await capturePayment({
        orderId: 'order-123',
        amount: 500,
        finalCapture: false,
      });

      expect(result.success).toBe(true);
      expect(result.capturedAmount).toBe(500);
    });

    it('should reject capture for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await capturePayment({
        orderId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should reject capture for already completed payment', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'completed',
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const result = await capturePayment({
        orderId: 'order-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment already captured');
    });

    it('should reject capture exceeding order total', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const result = await capturePayment({
        orderId: 'order-123',
        amount: 1500,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds order total');
    });

    it('should reject capture with zero or negative amount', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const result = await capturePayment({
        orderId: 'order-123',
        amount: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Capture amount must be greater than zero');
    });

    it('should handle manual payment capture', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORDER-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        stripeSessionId: null,
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'completed',
      } as never);
      vi.mocked(prisma.orderEvent.create).mockResolvedValue({} as never);

      const result = await capturePayment({
        orderId: 'order-123',
      });

      expect(result.success).toBe(true);
      expect(result.captureId).toBe('MANUAL-CAPTURE');
    });
  });

  describe('getCaptureStatus', () => {
    it('should return capture status for pending order', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORDER-123',
        totalAmount: 1000,
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        paidAt: null,
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const status = await getCaptureStatus('order-123');

      expect(status).not.toBeNull();
      expect(status?.isCapturable).toBe(true);
      expect(status?.paymentStatus).toBe('pending');
    });

    it('should return capture status for completed order', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORDER-123',
        totalAmount: 1000,
        paymentStatus: 'completed',
        paymentMethod: 'stripe',
        paidAt: new Date(),
        stripeSessionId: 'pi_test123',
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never);

      const status = await getCaptureStatus('order-123');

      expect(status).not.toBeNull();
      expect(status?.isCapturable).toBe(false);
      expect(status?.paymentStatus).toBe('completed');
    });

    it('should return null for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const status = await getCaptureStatus('non-existent');

      expect(status).toBeNull();
    });
  });
});
