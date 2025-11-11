import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma - must be before imports
vi.mock('./prisma', () => ({
  default: {
    product: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryReservation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  createReservation,
  releaseReservation,
  commitReservation,
  getAvailableStock,
  cleanupExpiredReservations,
  RESERVATION_TIMEOUT_MINUTES,
} from './inventory';
import prisma from './prisma';

const mockPrisma = prisma as any;

describe('Inventory Reservation System', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createReservation', () => {
    it('should create reservation successfully with available stock', async () => {
      const productId = 'prod-123';
      const quantity = 5;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue({ stockQuantity: 10 }),
          },
          inventoryReservation: {
            aggregate: vi
              .fn()
              .mockResolvedValue({ _sum: { quantity: 0 } }),
            create: vi.fn().mockResolvedValue({ id: 'res-123' }),
          },
        };
        return callback(tx);
      });

      const result = await createReservation({
        productId,
        quantity,
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('res-123');
      expect(result.availableStock).toBe(10);
    });

    it('should fail when insufficient stock available', async () => {
      const productId = 'prod-123';
      const quantity = 15;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue({ stockQuantity: 10 }),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 5 } }),
            create: vi.fn(),
          },
        };
        try {
          return await callback(tx);
        } catch (e) {
          throw e;
        }
      });

      const result = await createReservation({
        productId,
        quantity,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('should fail when quantity is not positive', async () => {
      const result = await createReservation({
        productId: 'prod-123',
        quantity: 0,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quantity must be positive');
    });

    it('should fail when neither userId nor sessionId provided', async () => {
      const result = await createReservation({
        productId: 'prod-123',
        quantity: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID or session ID required');
    });

    it('should consider existing reservations when checking availability', async () => {
      const productId = 'prod-123';
      const quantity = 3;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue({ stockQuantity: 10 }),
          },
          inventoryReservation: {
            // 7 already reserved
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 7 } }),
            create: vi.fn().mockResolvedValue({ id: 'res-123' }),
          },
        };
        return callback(tx);
      });

      const result = await createReservation({
        productId,
        quantity,
        sessionId: 'session-123',
      });

      expect(result.success).toBe(true);
      expect(result.availableStock).toBe(3); // 10 - 7 = 3
    });
  });

  describe('releaseReservation', () => {
    it('should release reservation successfully', async () => {
      mockPrisma.inventoryReservation.update.mockResolvedValue({
        id: 'res-123',
        status: 'released',
      });

      const result = await releaseReservation('res-123');

      expect(result).toBe(true);
      expect(mockPrisma.inventoryReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-123' },
        data: expect.objectContaining({
          status: 'released',
          releasedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('commitReservation', () => {
    it('should commit reservation and decrement stock for product', async () => {
      const reservationId = 'res-123';
      const orderId = 'order-123';

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue({
              id: reservationId,
              productId: 'prod-123',
              variantId: null,
              quantity: 5,
              status: 'active',
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          product: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await commitReservation(reservationId, orderId);

      expect(result).toBe(true);
    });

    it('should fail when reservation is not active', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'res-123',
              status: 'released',
            }),
            update: vi.fn(),
          },
        };
        try {
          return await callback(tx);
        } catch (e) {
          throw e;
        }
      });

      const result = await commitReservation('res-123', 'order-123');

      expect(result).toBe(false);
    });

    it('should fail when insufficient stock during commit', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'res-123',
              productId: 'prod-123',
              variantId: null,
              quantity: 5,
              status: 'active',
            }),
            update: vi.fn(),
          },
          product: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // No rows updated
          },
        };
        try {
          return await callback(tx);
        } catch (e) {
          throw e;
        }
      });

      const result = await commitReservation('res-123', 'order-123');

      expect(result).toBe(false);
    });
  });

  describe('getAvailableStock', () => {
    it('should calculate available stock correctly', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ stockQuantity: 20 });
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 8 },
      });

      const available = await getAvailableStock('prod-123');

      expect(available).toBe(12); // 20 - 8
    });

    it('should return 0 when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const available = await getAvailableStock('prod-123');

      expect(available).toBe(0);
    });

    it('should handle variant stock correctly', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        stockQuantity: 15,
      });
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 3 },
      });

      const available = await getAvailableStock('prod-123', 'var-456');

      expect(available).toBe(12); // 15 - 3
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should update expired reservations', async () => {
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({
        count: 5,
      });

      const count = await cleanupExpiredReservations();

      expect(count).toBe(5);
      expect(mockPrisma.inventoryReservation.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: 'expired',
          releasedAt: expect.any(Date),
        },
      });
    });
  });
});
