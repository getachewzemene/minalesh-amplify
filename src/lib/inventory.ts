/**
 * Inventory Reservation System
 * 
 * Prevents overselling by reserving stock during checkout process.
 * Reservations expire after a configurable time period.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

export const RESERVATION_TIMEOUT_MINUTES = 15;

export interface ReservationRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  availableStock?: number;
}

/**
 * Create inventory reservation with race condition protection
 */
export async function createReservation(
  request: ReservationRequest
): Promise<ReservationResult> {
  const { productId, variantId, quantity, userId, sessionId } = request;

  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be positive' };
  }

  if (!userId && !sessionId) {
    return { success: false, error: 'User ID or session ID required' };
  }

  try {
    // Use transaction for race condition protection
    const result = await prisma.$transaction(async (tx) => {
      // Get current stock and active reservations
      let availableStock = 0;
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { stockQuantity: true },
        });
        availableStock = variant?.stockQuantity ?? 0;
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stockQuantity: true },
        });
        availableStock = product?.stockQuantity ?? 0;
      }

      // Calculate reserved quantity
      const reservedQty = await tx.inventoryReservation.aggregate({
        where: {
          productId,
          variantId: variantId || null,
          status: 'active',
          expiresAt: { gt: new Date() },
        },
        _sum: { quantity: true },
      });

      const reservedAmount = reservedQty._sum.quantity ?? 0;
      const actuallyAvailable = availableStock - reservedAmount;

      if (actuallyAvailable < quantity) {
        throw new Error(
          `Insufficient stock: ${actuallyAvailable} available, ${quantity} requested`
        );
      }

      // Create reservation
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TIMEOUT_MINUTES);

      const reservation = await tx.inventoryReservation.create({
        data: {
          productId,
          variantId: variantId || null,
          quantity,
          userId: userId || null,
          sessionId: sessionId || null,
          status: 'active',
          expiresAt,
        },
      });

      return { reservationId: reservation.id, availableStock: actuallyAvailable };
    });

    return {
      success: true,
      reservationId: result.reservationId,
      availableStock: result.availableStock,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient stock')) {
      return { success: false, error: error.message };
    }
    console.error('Error creating reservation:', error);
    return { success: false, error: 'Failed to create reservation' };
  }
}

/**
 * Release a reservation (when order is cancelled or expired)
 */
export async function releaseReservation(reservationId: string): Promise<boolean> {
  try {
    await prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: 'released',
        releasedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Error releasing reservation:', error);
    return false;
  }
}

/**
 * Convert reservation to committed stock decrement (on payment success)
 */
export async function commitReservation(
  reservationId: string,
  orderId: string
): Promise<boolean> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get reservation details
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation || reservation.status !== 'active') {
        throw new Error('Invalid or inactive reservation');
      }

      // Decrement stock
      if (reservation.variantId) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: reservation.variantId,
            stockQuantity: { gte: reservation.quantity },
          },
          data: {
            stockQuantity: { decrement: reservation.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error('Insufficient stock to commit reservation');
        }
      } else {
        const updated = await tx.product.updateMany({
          where: {
            id: reservation.productId,
            stockQuantity: { gte: reservation.quantity },
          },
          data: {
            stockQuantity: { decrement: reservation.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error('Insufficient stock to commit reservation');
        }
      }

      // Mark reservation as committed
      await tx.inventoryReservation.update({
        where: { id: reservationId },
        data: {
          status: 'committed',
          orderId,
          releasedAt: new Date(),
        },
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('Error committing reservation:', error);
    return false;
  }
}

/**
 * Clean up expired reservations (should be run periodically)
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
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

    return result.count;
  } catch (error) {
    console.error('Error cleaning up reservations:', error);
    return 0;
  }
}

/**
 * Get available stock considering active reservations
 */
export async function getAvailableStock(
  productId: string,
  variantId?: string
): Promise<number> {
  try {
    let physicalStock = 0;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stockQuantity: true },
      });
      physicalStock = variant?.stockQuantity ?? 0;
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      });
      physicalStock = product?.stockQuantity ?? 0;
    }

    const reservedQty = await prisma.inventoryReservation.aggregate({
      where: {
        productId,
        variantId: variantId || null,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    const reserved = reservedQty._sum.quantity ?? 0;
    return Math.max(0, physicalStock - reserved);
  } catch (error) {
    console.error('Error getting available stock:', error);
    return 0;
  }
}

/**
 * Extend reservation expiration time
 */
export async function extendReservation(
  reservationId: string,
  additionalMinutes: number = RESERVATION_TIMEOUT_MINUTES
): Promise<boolean> {
  try {
    const reservation = await prisma.inventoryReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== 'active') {
      return false;
    }

    const newExpiry = new Date(reservation.expiresAt);
    newExpiry.setMinutes(newExpiry.getMinutes() + additionalMinutes);

    await prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: { expiresAt: newExpiry },
    });

    return true;
  } catch (error) {
    console.error('Error extending reservation:', error);
    return false;
  }
}
