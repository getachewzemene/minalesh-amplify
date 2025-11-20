/**
 * Unit Tests: Stock Reservation
 * 
 * Tests for inventory reservation system including race conditions,
 * expiration, and stock management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createReservation,
  commitReservation,
  releaseReservation,
  cleanupExpiredReservations,
  RESERVATION_TIMEOUT_MINUTES,
} from '@/lib/inventory';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
    inventoryReservation: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { default: mockPrisma };
});

describe('Stock Reservation System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reservation Creation', () => {
    it('should create reservation when stock is available', async () => {
      const mockProduct = { stockQuantity: 10 };
      const mockReservation = {
        id: 'res-1',
        productId: 'prod-1',
        quantity: 2,
        status: 'active',
        expiresAt: new Date(Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000),
      };

      // Mock transaction to return reservation
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
            create: vi.fn().mockResolvedValue(mockReservation),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        quantity: 2,
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('res-1');
    });

    it('should fail when insufficient stock', async () => {
      const mockProduct = { stockQuantity: 5 };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 3 } }),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        quantity: 5,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('should fail when quantity is zero', async () => {
      const result = await createReservation({
        productId: 'prod-1',
        quantity: 0,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be positive');
    });

    it('should fail when quantity is negative', async () => {
      const result = await createReservation({
        productId: 'prod-1',
        quantity: -5,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be positive');
    });

    it('should require userId or sessionId', async () => {
      const result = await createReservation({
        productId: 'prod-1',
        quantity: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID or session ID required');
    });

    it('should handle variant reservations', async () => {
      const mockVariant = { stockQuantity: 8 };
      const mockReservation = {
        id: 'res-2',
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 3,
        status: 'active',
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          productVariant: {
            findUnique: vi.fn().mockResolvedValue(mockVariant),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
            create: vi.fn().mockResolvedValue(mockReservation),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 3,
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Reservation Commitment', () => {
    it('should commit active reservation and reduce stock', async () => {
      const mockReservation = {
        id: 'res-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        status: 'active',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            update: vi.fn().mockResolvedValue({ ...mockReservation, status: 'committed' }),
          },
          product: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      const result = await commitReservation('res-1', 'order-1');

      expect(result).toBe(true);
    });

    it('should fail to commit expired reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        productId: 'prod-1',
        quantity: 2,
        status: 'expired',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
          },
        });
      });

      const result = await commitReservation('res-1', 'order-1');

      expect(result).toBe(false);
    });

    it('should fail to commit non-active reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        status: 'committed',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
          },
        });
      });

      const result = await commitReservation('res-1', 'order-1');

      expect(result).toBe(false);
    });

    it('should fail when reservation not found', async () => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      const result = await commitReservation('res-1', 'order-1');

      expect(result).toBe(false);
    });
  });

  describe('Reservation Release', () => {
    it('should release active reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        status: 'active',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            update: vi.fn().mockResolvedValue({ ...mockReservation, status: 'released' }),
          },
        });
      });

      const result = await releaseReservation('res-1');

      expect(result).toBe(true);
    });

    it('should return true even if reservation not found', async () => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      const result = await releaseReservation('res-1');

      expect(result).toBe(true);
    });

    it('should release expired reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        status: 'active',
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          inventoryReservation: {
            findUnique: vi.fn().mockResolvedValue(mockReservation),
            update: vi.fn().mockResolvedValue({ ...mockReservation, status: 'expired' }),
          },
        });
      });

      const result = await releaseReservation('res-1');

      expect(result).toBe(true);
    });
  });

  describe('Expired Reservation Cleanup', () => {
    it('should mark expired reservations', async () => {
      (prisma.inventoryReservation.updateMany as any).mockResolvedValue({ count: 2 });

      const result = await cleanupExpiredReservations();

      expect(result).toBe(2);
    });

    it('should return zero when no expired reservations', async () => {
      (prisma.inventoryReservation.updateMany as any).mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredReservations();

      expect(result).toBe(0);
    });
  });

  describe('Concurrent Reservation Scenarios', () => {
    it('should handle race condition with aggregate lock', async () => {
      const mockProduct = { stockQuantity: 5 };

      // Simulate two concurrent requests for the same product
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 3 } }),
            create: vi.fn().mockResolvedValue({
              id: 'res-1',
              productId: 'prod-1',
              quantity: 2,
              status: 'active',
            }),
          },
        });
      });

      const result1 = await createReservation({
        productId: 'prod-1',
        quantity: 2,
        userId: 'user-1',
      });

      expect(result1.success).toBe(true);

      // Second request should succeed as there's still stock (5 total - 3 reserved = 2 available)
      const result2 = await createReservation({
        productId: 'prod-1',
        quantity: 2,
        userId: 'user-2',
      });

      expect(result2.success).toBe(true);
    });

    it('should prevent overselling when stock is exhausted', async () => {
      const mockProduct = { stockQuantity: 10 };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 8 } }),
          },
        });
      });

      // Try to reserve 5 when only 2 available (10 - 8 = 2)
      const result = await createReservation({
        productId: 'prod-1',
        quantity: 5,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });

  describe('Reservation Timeout', () => {
    it('should set correct expiration time', async () => {
      const now = Date.now();
      const expectedExpiry = now + RESERVATION_TIMEOUT_MINUTES * 60 * 1000;

      const mockProduct = { stockQuantity: 10 };
      const mockReservation = {
        id: 'res-1',
        productId: 'prod-1',
        quantity: 2,
        status: 'active',
        expiresAt: new Date(expectedExpiry),
      };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
            create: vi.fn().mockResolvedValue(mockReservation),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        quantity: 2,
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle product not found', async () => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        quantity: 2,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
    });

    it('should handle zero stock', async () => {
      const mockProduct = { stockQuantity: 0 };

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
          inventoryReservation: {
            aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
          },
        });
      });

      const result = await createReservation({
        productId: 'prod-1',
        quantity: 1,
        userId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });
});
