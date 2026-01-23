/**
 * Order Service
 * 
 * Handles order creation, retrieval, and management business logic.
 * Separates business logic from HTTP concerns in API routes.
 */

import prisma from '@/lib/prisma';
import { sendEmail, createOrderConfirmationEmail } from '@/lib/email';
import { redeemPoints } from '@/services/LoyaltyService';
import type { PaymentMethod } from '@/types/payment';

export interface CreateOrderRequest {
  userId: string;
  items: Array<{
    id: string;
    quantity: number;
  }>;
  paymentMethod: 'COD' | 'TeleBirr' | 'CBE' | 'Awash' | 'BankTransfer' | 'Other';
  paymentMeta?: {
    phone?: string;
    reference?: string;
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  billingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  loyaltyPointsToRedeem?: number;
  giftCardCode?: string;
  giftCardAmount?: number;
}

export interface OrderItem {
  vendorId: string | null;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateOrderResult {
  success: boolean;
  order?: any;
  error?: string;
  details?: any;
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(userId: string) {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          price: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new order from cart items
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResult> {
  const { userId, items, paymentMethod, paymentMeta, shippingAddress, billingAddress, loyaltyPointsToRedeem, giftCardCode, giftCardAmount } = request;

  try {
    // Validate TeleBirr specific requirements
    if (paymentMethod === 'TeleBirr') {
      if (!paymentMeta?.phone || !paymentMeta?.reference) {
        return { 
          success: false, 
          error: 'TeleBirr phone and reference required' 
        };
      }
    }

    // Fetch products to validate and get authoritative pricing/vendor
    const productIds = items.map(i => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, sku: true, vendorId: true }
    });

    if (products.length !== productIds.length) {
      return { 
        success: false, 
        error: 'Some products were not found' 
      };
    }

    // Build order totals and check inventory
    let subtotal = 0;
    const orderItemsData: OrderItem[] = items.map((ci) => {
      const p = products.find(pp => pp.id === ci.id)!;
      const qty = Math.max(1, Number(ci.quantity || 1));
      const price = Number(p.price);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      return {
        vendorId: p.vendorId,
        productId: p.id,
        productName: p.name,
        productSku: p.sku ?? null,
        quantity: qty,
        price,
        total: lineTotal,
      };
    });

    // Pre-check inventory availability
    const insufficient: { id: string; available: number; requested: number }[] = [];
    for (const oi of orderItemsData) {
      const prod = await prisma.product.findUnique({ 
        where: { id: oi.productId }, 
        select: { stockQuantity: true, name: true } 
      });
      const available = prod?.stockQuantity ?? 0;
      if (oi.quantity > available) {
        insufficient.push({ id: oi.productId, available, requested: oi.quantity });
      }
    }

    if (insufficient.length > 0) {
      return { 
        success: false, 
        error: 'Insufficient stock', 
        details: insufficient 
      };
    }

    // Handle loyalty points redemption
    let loyaltyDiscount = 0;
    let redemptionTransactionId: string | undefined;
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      try {
        // Initial redemption - will be linked to order after creation
        const redemption = await redeemPoints(
          userId,
          loyaltyPointsToRedeem,
          `Redeemed for order`,
          undefined
        );
        loyaltyDiscount = redemption.discountAmount;
        redemptionTransactionId = redemption.transaction.id;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to redeem points'
        };
      }
    }

    // Handle gift card redemption
    let giftCardDiscount = 0;
    let giftCard: any = null;
    if (giftCardCode && giftCardAmount && giftCardAmount > 0) {
      try {
        // Fetch and validate gift card
        giftCard = await prisma.giftCard.findUnique({
          where: { code: giftCardCode }
        });

        if (!giftCard) {
          return {
            success: false,
            error: 'Invalid gift card code'
          };
        }

        if (giftCard.balance < giftCardAmount) {
          return {
            success: false,
            error: 'Insufficient gift card balance'
          };
        }

        if (giftCard.status !== 'active') {
          return {
            success: false,
            error: 'Gift card is not active'
          };
        }

        if (new Date(giftCard.expiresAt) < new Date()) {
          return {
            success: false,
            error: 'Gift card has expired'
          };
        }

        // Check if user is authorized to use this gift card
        if (giftCard.recipientId && giftCard.recipientId !== userId) {
          return {
            success: false,
            error: 'You are not authorized to use this gift card'
          };
        }

        giftCardDiscount = giftCardAmount;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate gift card'
        };
      }
    }

    const orderNumber = `MIN-${Date.now()}`;
    const totalAmount = Math.max(0, subtotal - loyaltyDiscount - giftCardDiscount);

    // Atomic transaction: decrement stock and create order
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Decrement stock for each product conditionally
        for (const oi of orderItemsData) {
          const updateRes = await tx.product.updateMany({
            where: { id: oi.productId, stockQuantity: { gte: oi.quantity } },
            data: { stockQuantity: { decrement: oi.quantity } },
          });
          if (updateRes.count === 0) {
            throw new Error(`Insufficient stock for product ${oi.productId}`);
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            userId,
            orderNumber,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod,
            paymentReference: paymentMethod === 'TeleBirr' ? paymentMeta?.reference : undefined,
            subtotal: subtotal.toFixed(2),
            shippingAmount: '0.00',
            taxAmount: '0.00',
            discountAmount: (loyaltyDiscount + giftCardDiscount).toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            currency: 'ETB',
            shippingAddress: shippingAddress || undefined,
            billingAddress: billingAddress || undefined,
            orderItems: {
              create: orderItemsData.map(oi => ({
                vendorId: oi.vendorId,
                productId: oi.productId,
                productName: oi.productName,
                productSku: oi.productSku,
                quantity: oi.quantity,
                price: oi.price,
                total: oi.total,
              }))
            },
            notes: paymentMethod === 'TeleBirr' ? `TeleBirr Phone: ${paymentMeta?.phone}` : undefined,
          },
          include: { orderItems: true }
        });

        // Redeem gift card if applicable
        if (giftCard && giftCardDiscount > 0) {
          const newBalance = Number(giftCard.balance) - giftCardDiscount;
          await tx.giftCard.update({
            where: { id: giftCard.id },
            data: {
              balance: newBalance,
              status: newBalance <= 0 ? 'redeemed' : 'active',
              redeemedAt: newBalance <= 0 ? new Date() : undefined,
            }
          });

          // Create gift card transaction
          await tx.giftCardTransaction.create({
            data: {
              cardId: giftCard.id,
              orderId: createdOrder.id,
              amount: giftCardDiscount,
              type: 'redeem',
            }
          });
        }

        return createdOrder;
      });

      // Send order confirmation email asynchronously
      sendOrderConfirmationEmail(userId, order).catch(err => 
        console.error('Failed to send order confirmation email:', err)
      );

      return { success: true, order };
    } catch (txErr: unknown) {
      console.error('Transaction error creating order:', txErr);
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      if (msg.includes('Insufficient stock')) {
        return { 
          success: false, 
          error: 'Insufficient stock (concurrent)', 
          details: msg 
        };
      }
      return { success: false, error: 'An error occurred' };
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmationEmail(userId: string, order: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      const orderItems = order.orderItems.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
      }));

      const emailTemplate = createOrderConfirmationEmail(
        user.email,
        order.orderNumber,
        order.totalAmount.toString(),
        orderItems
      );
      
      await sendEmail(emailTemplate);
    }
  } catch (emailError) {
    console.error('Error preparing order confirmation email:', emailError);
    // Don't fail the order if email fails
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string, userId?: string) {
  const where: any = { id: orderId };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.order.findUnique({
    where,
    include: {
      orderItems: true,
    },
  });
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  userId?: string
) {
  const where: any = { id: orderId };
  if (userId) {
    where.userId = userId;
  }

  // Validate status is a valid OrderStatus enum value
  const validStatuses = ['pending', 'paid', 'confirmed', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }

  return await prisma.order.update({
    where,
    data: { status: status as any },
  });
}
