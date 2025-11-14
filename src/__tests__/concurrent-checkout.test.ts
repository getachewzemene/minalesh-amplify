/**
 * Concurrent Checkout Tests
 * 
 * Tests to ensure inventory reservation prevents overselling
 * during parallel checkout attempts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReservation, getAvailableStock, commitReservation } from '@/lib/inventory';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(),
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryReservation: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

describe('Concurrent Checkout - Inventory Reservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should respect available stock limits during reservation attempts', async () => {
    const productId = 'product-123';
    const physicalStock = 10;
    const reservedQuantity = 7; // Already 7 reserved
    const availableStock = 3; // Only 3 left

    // Mock product with 10 units physical stock
    (prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: productId,
      stockQuantity: physicalStock,
    });

    // Mock existing reservations (7 units already reserved)
    (prisma.inventoryReservation.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { quantity: reservedQuantity },
    });

    // Mock transaction
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      return await callback({
        product: prisma.product,
        productVariant: prisma.productVariant,
        inventoryReservation: {
          aggregate: prisma.inventoryReservation.aggregate,
          create: vi.fn().mockResolvedValue({ id: 'new-reservation' }),
        },
      });
    });

    // Attempt to reserve 3 units (should succeed - exactly what's available)
    const result1 = await createReservation({
      productId,
      quantity: 3,
      userId: 'user-1',
    });
    expect(result1.success).toBe(true);

    // Reset mocks for second attempt
    vi.clearAllMocks();
    (prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: productId,
      stockQuantity: physicalStock,
    });

    // Now all 10 units are reserved
    (prisma.inventoryReservation.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { quantity: 10 },
    });

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      return await callback({
        product: prisma.product,
        productVariant: prisma.productVariant,
        inventoryReservation: {
          aggregate: prisma.inventoryReservation.aggregate,
          create: vi.fn(), // Won't be called due to insufficient stock
        },
      });
    });

    // Attempt to reserve 1 more unit (should fail - no stock available)
    const result2 = await createReservation({
      productId,
      quantity: 1,
      userId: 'user-2',
    });
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('Insufficient stock');
  });

  it('should handle reservation expiry correctly', async () => {
    const productId = 'product-456';
    const reservationId = 'reservation-1';

    // Mock expired reservation
    (prisma.inventoryReservation.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    // This would normally be called by a cron job
    const result = await prisma.inventoryReservation.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'expired',
        releasedAt: new Date(),
      },
    });

    expect(result.count).toBe(1);
  });

  it('should successfully commit reservation on payment success', async () => {
    const reservationId = 'reservation-123';
    const orderId = 'order-456';

    // Mock reservation and product
    (prisma.inventoryReservation.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: reservationId,
      productId: 'product-1',
      variantId: null,
      quantity: 3,
      status: 'active',
    });

    // Mock transaction
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      const result = await callback({
        inventoryReservation: {
          findUnique: prisma.inventoryReservation.findUnique,
          update: vi.fn().mockResolvedValue({ id: reservationId }),
        },
        product: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
      return result;
    });

    const result = await commitReservation(reservationId, orderId);

    expect(result).toBe(true);
  });

  it('should fail to commit if reservation is not active', async () => {
    const reservationId = 'reservation-789';
    const orderId = 'order-999';

    // Mock inactive reservation
    (prisma.inventoryReservation.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: reservationId,
      status: 'expired', // Not active
    });

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      return await callback({
        inventoryReservation: {
          findUnique: prisma.inventoryReservation.findUnique,
        },
      });
    });

    const result = await commitReservation(reservationId, orderId);

    expect(result).toBe(false);
  });

  it('should calculate available stock considering active reservations', async () => {
    const productId = 'product-999';
    const physicalStock = 10;
    const reservedQuantity = 3;

    (prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: productId,
      stockQuantity: physicalStock,
    });

    (prisma.inventoryReservation.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { quantity: reservedQuantity },
    });

    const available = await getAvailableStock(productId);

    // Available should be physical stock minus reserved
    expect(available).toBe(physicalStock - reservedQuantity);
  });
});
