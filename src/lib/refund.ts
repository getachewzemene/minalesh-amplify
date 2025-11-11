/**
 * Refund Management System
 * 
 * Handles full and partial refunds with stock restoration.
 * Provider-agnostic with extensible provider-specific logic.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

export interface RefundRequest {
  orderId: string;
  amount: Decimal.Value;
  reason?: string;
  restoreStock?: boolean;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Initiate a refund for an order
 */
export async function initiateRefund(
  request: RefundRequest
): Promise<RefundResult> {
  const { orderId, amount, reason, restoreStock = true } = request;

  try {
    // Validate order exists and can be refunded
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
        refunds: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus !== 'completed') {
      return { success: false, error: 'Order payment not completed' };
    }

    // Calculate total refunded amount
    const totalRefunded = order.refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const requestedAmount = Number(amount);
    const orderTotal = Number(order.totalAmount);

    if (totalRefunded + requestedAmount > orderTotal) {
      return {
        success: false,
        error: `Refund amount exceeds order total (${orderTotal - totalRefunded} remaining)`,
      };
    }

    // Create refund record
    const refund = await prisma.$transaction(async (tx) => {
      const newRefund = await tx.refund.create({
        data: {
          orderId,
          amount: new Prisma.Decimal(amount),
          reason: reason || null,
          status: 'pending',
          provider: order.paymentMethod || 'manual',
        },
      });

      // Restore stock if requested (for full or partial refunds)
      if (restoreStock && order.orderItems.length > 0) {
        const isFullRefund = totalRefunded + requestedAmount >= orderTotal;
        
        for (const item of order.orderItems) {
          // For full refund, restore all quantities
          // For partial refund, restore proportionally (simplified: restore all for now)
          const restoreQty = isFullRefund ? item.quantity : item.quantity;

          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: { increment: restoreQty },
              },
            });
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: { increment: restoreQty },
              },
            });
          }
        }
      }

      return newRefund;
    });

    // TODO: Call payment provider API to process refund
    // For now, mark as pending for manual processing
    
    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    console.error('Error initiating refund:', error);
    return { success: false, error: 'Failed to initiate refund' };
  }
}

/**
 * Process refund with payment provider
 * This is a placeholder for provider-specific implementation
 */
export async function processRefund(refundId: string): Promise<boolean> {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { order: true },
    });

    if (!refund) {
      return false;
    }

    // Provider-specific logic would go here
    // For now, we'll simulate immediate success
    const provider = refund.provider?.toLowerCase();

    let success = false;
    let providerRefundId: string | null = null;

    switch (provider) {
      case 'telebirr':
        // TODO: Implement TeleBirr refund API
        success = true;
        providerRefundId = `TBR-${Date.now()}`;
        break;
      case 'cbe':
        // TODO: Implement CBE refund API
        success = true;
        providerRefundId = `CBE-${Date.now()}`;
        break;
      case 'awash':
        // TODO: Implement Awash Bank refund API
        success = true;
        providerRefundId = `AWB-${Date.now()}`;
        break;
      case 'cod':
        // Cash refunds are manual
        success = true;
        providerRefundId = 'MANUAL';
        break;
      default:
        success = true;
        providerRefundId = 'MANUAL';
    }

    // Update refund status
    await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: success ? 'completed' : 'failed',
        providerRefundId,
        processedAt: success ? new Date() : null,
        failedAt: success ? null : new Date(),
        failureReason: success ? null : 'Provider processing failed',
      },
    });

    // Update order status if fully refunded
    if (success) {
      const order = await prisma.order.findUnique({
        where: { id: refund.orderId },
        include: { refunds: true },
      });

      if (order) {
        const totalRefunded = order.refunds
          .filter((r) => r.status === 'completed')
          .reduce((sum, r) => sum + Number(r.amount), 0);

        if (totalRefunded >= Number(order.totalAmount)) {
          await prisma.order.update({
            where: { id: refund.orderId },
            data: {
              status: 'refunded',
              paymentStatus: 'refunded',
              refundedAt: new Date(),
            },
          });
        }
      }
    }

    return success;
  } catch (error) {
    console.error('Error processing refund:', error);
    return false;
  }
}

/**
 * Get refund status
 */
export async function getRefundStatus(refundId: string) {
  return prisma.refund.findUnique({
    where: { id: refundId },
    include: {
      order: {
        select: {
          orderNumber: true,
          totalAmount: true,
          paymentMethod: true,
        },
      },
    },
  });
}

/**
 * List refunds for an order
 */
export async function getOrderRefunds(orderId: string) {
  return prisma.refund.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Calculate refundable amount for an order
 */
export async function getRefundableAmount(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });

  if (!order) {
    return 0;
  }

  const totalRefunded = order.refunds
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const orderTotal = Number(order.totalAmount);
  return Math.max(0, orderTotal - totalRefunded);
}
