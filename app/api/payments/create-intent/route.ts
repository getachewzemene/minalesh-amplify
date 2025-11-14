import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createReservation } from '@/lib/inventory';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

const createIntentSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive().max(999),
    })
  ).min(1),
  shippingAddress: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
      line1: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  billingAddress: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
      line1: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  couponCode: z.string().optional(),
  shippingMethodId: z.string().uuid().optional(),
});

/**
 * POST /api/payments/create-intent
 * Create a payment intent and reserve inventory
 */
export async function POST(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { items, shippingAddress, billingAddress, couponCode, shippingMethodId } = parsed.data;

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
      return NextResponse.json(
        { error: 'Some products were not found' },
        { status: 400 }
      );
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
          userId: payload!.userId,
        });

        if (!reservation.success) {
          // Release any reservations we've already made
          for (const resId of reservations) {
            await prisma.inventoryReservation.update({
              where: { id: resId },
              data: { status: 'released', releasedAt: new Date() },
            });
          }
          return NextResponse.json(
            { error: reservation.error || 'Failed to reserve inventory' },
            { status: 409 }
          );
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

    // Calculate shipping (simplified - using shipping method if provided)
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

    const totalAmount = subtotalAfterDiscount + shippingAmount + taxAmount;

    // Create order with pending status
    const orderNumber = `MIN-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        userId: payload!.userId,
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
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: payload!.userId,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        stripePaymentIntent = {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
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

    return NextResponse.json({
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
      },
      reservations,
      stripePaymentIntent,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating payment intent' },
      { status: 500 }
    );
  }
}
