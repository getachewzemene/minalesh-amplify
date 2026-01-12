/**
 * Payment Service
 * 
 * Handles payment intent creation, inventory reservation,
 * and payment processing logic.
 */

import prisma from '@/lib/prisma';
import { createReservation } from './InventoryService';
import { calculateProtectionFee } from '@/lib/buyer-protection';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

export interface CreatePaymentIntentRequest {
  userId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress?: any;
  billingAddress?: any;
  couponCode?: string;
  shippingMethodId?: string;
  captureMethod?: 'automatic' | 'manual';
  // Buyer Protection options
  enableBuyerProtection?: boolean;
  enableInsurance?: boolean;
}

export interface PaymentIntentResult {
  success: boolean;
  order?: any;
  reservations?: string[];
  stripePaymentIntent?: {
    id: string;
    clientSecret: string | null;
    captureMethod: string;
  };
  expiresAt?: string;
  error?: string;
}

/**
 * Create payment intent with inventory reservation
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResult> {
  const {
    userId,
    items,
    shippingAddress,
    billingAddress,
    couponCode,
    shippingMethodId,
    captureMethod = 'automatic',
    enableBuyerProtection = false,
    enableInsurance = false,
  } = request;

  try {
    // Fetch products to validate and calculate totals
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        sku: true,
        vendorId: true,
        stockQuantity: true,
      },
    });

    if (products.length !== productIds.length) {
      return {
        success: false,
        error: 'Some products were not found',
      };
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const price = Number(product.salePrice || product.price);
      const total = price * item.quantity;
      subtotal += total;

      return {
        vendorId: product.vendorId,
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        price,
        total,
      };
    });

    // Reserve inventory for all items
    const reservations: string[] = [];
    try {
      for (const item of items) {
        const reservation = await createReservation({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          userId,
        });

        if (!reservation.success) {
          // Release any reservations we've already made
          for (const resId of reservations) {
            await prisma.inventoryReservation.update({
              where: { id: resId },
              data: { status: 'released', releasedAt: new Date() },
            });
          }
          return {
            success: false,
            error: reservation.error || 'Failed to reserve inventory',
          };
        }

        reservations.push(reservation.reservationId!);
      }
    } catch (reservationError) {
      // Cleanup on error
      for (const resId of reservations) {
        await prisma.inventoryReservation
          .update({
            where: { id: resId },
            data: { status: 'released', releasedAt: new Date() },
          })
          .catch((e) => console.error('Error releasing reservation:', e));
      }
      throw reservationError;
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          status: 'active',
          AND: [
            {
              OR: [
                { startsAt: null },
                { startsAt: { lte: new Date() } },
              ],
            },
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } },
              ],
            },
          ],
        },
      });

      if (coupon) {
        // Validate minimum purchase
        if (coupon.minimumPurchase && subtotal < Number(coupon.minimumPurchase)) {
          // Continue without coupon
        } else {
          couponId = coupon.id;
          if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
            if (coupon.maximumDiscount) {
              discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
            }
          } else if (coupon.discountType === 'fixed_amount') {
            discountAmount = Number(coupon.discountValue);
          }
        }
      }
    }

    // Calculate shipping
    let shippingAmount = 0;
    let taxAmount = 0;
    let shippingZoneId: string | null = null;

    if (shippingMethodId) {
      const shippingRate = await prisma.shippingRate.findFirst({
        where: { methodId: shippingMethodId },
        include: { zone: true, method: true },
      });

      if (shippingRate) {
        shippingZoneId = shippingRate.zoneId;
        shippingAmount = Number(shippingRate.baseRate);
        
        // Check for free shipping threshold
        if (
          shippingRate.freeShippingThreshold &&
          subtotal >= Number(shippingRate.freeShippingThreshold)
        ) {
          shippingAmount = 0;
        }
      }
    }

    // Calculate tax (15% VAT for Ethiopia)
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxRate = await prisma.taxRate.findFirst({
      where: { country: 'ET', isActive: true },
      orderBy: { priority: 'desc' },
    });

    if (taxRate) {
      taxAmount = (subtotalAfterDiscount + shippingAmount) * Number(taxRate.rate);
    } else {
      // Default Ethiopian VAT
      taxAmount = (subtotalAfterDiscount + shippingAmount) * 0.15;
    }

    // Calculate buyer protection fees
    const protectionResult = await calculateProtectionFee(
      subtotalAfterDiscount,
      enableBuyerProtection,
      enableInsurance
    );

    const totalAmount = subtotalAfterDiscount + shippingAmount + taxAmount + protectionResult.totalFee;

    // Create order with pending status
    const orderNumber = `MIN-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        subtotal: subtotal.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        currency: 'ETB',
        shippingAddress: shippingAddress || undefined,
        billingAddress: billingAddress || undefined,
        couponId,
        shippingMethodId: shippingMethodId || null,
        shippingZoneId,
        // Buyer protection fields
        buyerProtectionEnabled: enableBuyerProtection,
        protectionFee: protectionResult.protectionFee.toFixed(2),
        insuranceEnabled: enableInsurance && protectionResult.isHighValue,
        insuranceFee: protectionResult.insuranceFee.toFixed(2),
        shippingDeadline: enableBuyerProtection ? protectionResult.shippingDeadline : null,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { orderItems: true },
    });

    // Link reservations to order
    await prisma.inventoryReservation.updateMany({
      where: { id: { in: reservations } },
      data: { orderId: order.id },
    });

    // Create Stripe payment intent if configured
    let stripePaymentIntent = null;
    if (stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd', // Note: Stripe doesn't support ETB directly
          capture_method: captureMethod,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId,
            captureMethod,
            buyerProtectionEnabled: enableBuyerProtection ? 'true' : 'false',
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        stripePaymentIntent = {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          captureMethod: paymentIntent.capture_method,
        };

        // Update order with Stripe session ID
        await prisma.order.update({
          where: { id: order.id },
          data: { stripeSessionId: paymentIntent.id },
        });
      } catch (stripeError) {
        console.error('Error creating Stripe payment intent:', stripeError);
        // Continue without Stripe - order can still be completed with other methods
      }
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
        // Buyer protection info
        buyerProtection: {
          enabled: enableBuyerProtection,
          protectionFee: protectionResult.protectionFee,
          insuranceEnabled: enableInsurance && protectionResult.isHighValue,
          insuranceFee: protectionResult.insuranceFee,
          totalFee: protectionResult.totalFee,
          shippingDeadline: protectionResult.shippingDeadline?.toISOString() || null,
          isHighValue: protectionResult.isHighValue,
        },
      },
      reservations,
      stripePaymentIntent: stripePaymentIntent || undefined,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: 'An error occurred while creating payment intent',
    };
  }
}

/**
 * Capture a payment
 */
export async function capturePayment(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amount,
    });

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        amountCaptured: 'amount_captured' in paymentIntent ? (paymentIntent.amount_captured ?? 0) : 0,
      },
    };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture payment',
    };
  }
}
