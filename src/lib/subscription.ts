/**
 * Subscription Service
 * Handles Minalesh Premium and Subscribe & Save features
 */

import prisma from './prisma';
import {
  SubscriptionStatus,
  SubscriptionPlanType,
  SubscriptionFrequency,
  Prisma,
} from '@prisma/client';
import { addDays, addWeeks, addMonths, isBefore, isAfter } from 'date-fns';

// Premium subscription pricing (in ETB)
export const PREMIUM_PRICING = {
  monthly: {
    price: 99,
    daysInPeriod: 30,
  },
  yearly: {
    price: 999,
    daysInPeriod: 365,
  },
} as const;

// Premium subscription benefits
export const PREMIUM_BENEFITS = {
  freeShipping: true,
  extendedReturns: 14, // days
  loyaltyPointsMultiplier: 2,
  prioritySupport: true,
  exclusiveDeals: true,
  earlyAccess: true,
} as const;

// Subscribe & Save discount
export const SUBSCRIBE_SAVE_DISCOUNT = 10; // percentage

/**
 * Calculate next delivery date based on frequency
 */
export function calculateNextDeliveryDate(
  fromDate: Date,
  frequency: SubscriptionFrequency
): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(fromDate, 1);
    case 'biweekly':
      return addWeeks(fromDate, 2);
    case 'monthly':
      return addMonths(fromDate, 1);
    case 'bimonthly':
      return addMonths(fromDate, 2);
    case 'quarterly':
      return addMonths(fromDate, 3);
    default:
      return addMonths(fromDate, 1);
  }
}

/**
 * Check if user has active premium subscription
 */
export async function hasActivePremiumSubscription(
  userId: string
): Promise<boolean> {
  const subscription = await prisma.premiumSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) return false;

  return (
    subscription.status === 'active' &&
    isAfter(subscription.currentPeriodEnd, new Date())
  );
}

/**
 * Get premium subscription details
 */
export async function getPremiumSubscription(userId: string) {
  return prisma.premiumSubscription.findUnique({
    where: { userId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Create premium subscription
 */
export async function createPremiumSubscription(
  userId: string,
  planType: SubscriptionPlanType = 'premium_monthly',
  paymentMethod?: string
) {
  const now = new Date();
  const isYearly = planType === 'premium_yearly';
  const pricing = isYearly ? PREMIUM_PRICING.yearly : PREMIUM_PRICING.monthly;
  const periodEnd = addDays(now, pricing.daysInPeriod);

  return prisma.premiumSubscription.create({
    data: {
      userId,
      planType,
      status: 'active',
      priceAmount: pricing.price,
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentMethod,
      autoRenew: true,
    },
  });
}

/**
 * Cancel premium subscription
 */
export async function cancelPremiumSubscription(
  userId: string,
  immediate: boolean = false
) {
  const subscription = await prisma.premiumSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  if (immediate) {
    return prisma.premiumSubscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });
  }

  // Cancel at end of billing period
  return prisma.premiumSubscription.update({
    where: { userId },
    data: {
      autoRenew: false,
      cancelledAt: new Date(),
    },
  });
}

/**
 * Pause premium subscription
 */
export async function pausePremiumSubscription(
  userId: string,
  resumeDate?: Date
) {
  const subscription = await prisma.premiumSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  return prisma.premiumSubscription.update({
    where: { userId },
    data: {
      status: 'paused',
      pausedAt: new Date(),
      resumeAt: resumeDate,
    },
  });
}

/**
 * Resume premium subscription
 */
export async function resumePremiumSubscription(userId: string) {
  const subscription = await prisma.premiumSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  // Extend period by time paused
  const pausedDuration = subscription.pausedAt
    ? new Date().getTime() - subscription.pausedAt.getTime()
    : 0;
  const newPeriodEnd = new Date(
    subscription.currentPeriodEnd.getTime() + pausedDuration
  );

  return prisma.premiumSubscription.update({
    where: { userId },
    data: {
      status: 'active',
      pausedAt: null,
      resumeAt: null,
      currentPeriodEnd: newPeriodEnd,
    },
  });
}

/**
 * Get all product subscriptions for a user
 */
export async function getProductSubscriptions(userId: string) {
  return prisma.productSubscription.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          images: true,
          stockQuantity: true,
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create product subscription (Subscribe & Save)
 */
export async function createProductSubscription(
  userId: string,
  productId: string,
  options: {
    variantId?: string;
    quantity?: number;
    frequency?: SubscriptionFrequency;
    shippingAddressId?: string;
    deliveryInstructions?: string;
  } = {}
) {
  const {
    variantId,
    quantity = 1,
    frequency = 'monthly',
    shippingAddressId,
    deliveryInstructions,
  } = options;

  // Get product price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, salePrice: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const priceAtSubscription = product.salePrice ?? product.price;
  const nextDeliveryDate = calculateNextDeliveryDate(new Date(), frequency);

  return prisma.productSubscription.create({
    data: {
      userId,
      productId,
      variantId,
      quantity,
      frequency,
      status: 'active',
      discountPercent: SUBSCRIBE_SAVE_DISCOUNT,
      priceAtSubscription,
      nextDeliveryDate,
      shippingAddressId,
      deliveryInstructions,
    },
  });
}

/**
 * Update product subscription
 */
export async function updateProductSubscription(
  subscriptionId: string,
  userId: string,
  updates: {
    quantity?: number;
    frequency?: SubscriptionFrequency;
    shippingAddressId?: string;
    deliveryInstructions?: string;
  }
) {
  // Verify ownership
  const subscription = await prisma.productSubscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // If frequency changed, recalculate next delivery date
  const nextDeliveryDate =
    updates.frequency && updates.frequency !== subscription.frequency
      ? calculateNextDeliveryDate(new Date(), updates.frequency)
      : undefined;

  return prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      ...updates,
      ...(nextDeliveryDate && { nextDeliveryDate }),
    },
  });
}

/**
 * Cancel product subscription
 */
export async function cancelProductSubscription(
  subscriptionId: string,
  userId: string,
  reason?: string
) {
  // Verify ownership
  const subscription = await prisma.productSubscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });
}

/**
 * Pause product subscription
 */
export async function pauseProductSubscription(
  subscriptionId: string,
  userId: string,
  resumeDate?: Date
) {
  // Verify ownership
  const subscription = await prisma.productSubscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'paused',
      pausedAt: new Date(),
      resumeAt: resumeDate,
    },
  });
}

/**
 * Resume product subscription
 */
export async function resumeProductSubscription(
  subscriptionId: string,
  userId: string
) {
  // Verify ownership
  const subscription = await prisma.productSubscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Recalculate next delivery date from now
  const nextDeliveryDate = calculateNextDeliveryDate(
    new Date(),
    subscription.frequency
  );

  return prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'active',
      pausedAt: null,
      resumeAt: null,
      nextDeliveryDate,
    },
  });
}

/**
 * Skip next delivery for product subscription
 */
export async function skipNextDelivery(
  subscriptionId: string,
  userId: string
) {
  // Verify ownership
  const subscription = await prisma.productSubscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Add current next delivery to skipped dates
  const skippedDates = [
    ...subscription.skippedDates,
    subscription.nextDeliveryDate,
  ];

  // Calculate new next delivery date
  const nextDeliveryDate = calculateNextDeliveryDate(
    subscription.nextDeliveryDate,
    subscription.frequency
  );

  return prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      skippedDates,
      nextDeliveryDate,
    },
  });
}

/**
 * Get subscriptions due for delivery
 * Used by cron job to process subscription orders
 */
export async function getSubscriptionsDueForDelivery() {
  const now = new Date();

  return prisma.productSubscription.findMany({
    where: {
      status: 'active',
      nextDeliveryDate: {
        lte: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      product: true,
      variant: true,
    },
  });
}

/**
 * Process subscription delivery (create order)
 */
export async function processSubscriptionDelivery(subscriptionId: string) {
  const subscription = await prisma.productSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      product: true,
      variant: true,
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate discounted price
  const basePrice = subscription.variant?.price ?? subscription.product.price;
  const discountedPrice =
    Number(basePrice) * (1 - Number(subscription.discountPercent) / 100);
  const itemTotal = discountedPrice * subscription.quantity;

  // Create order (simplified - actual implementation would use full order creation flow)
  const orderNumber = `SUB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      userId: subscription.userId,
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending',
      subtotal: itemTotal,
      totalAmount: itemTotal,
      notes: `Subscription order for ${subscription.product.name}`,
      orderItems: {
        create: {
          vendorId: subscription.product.vendorId,
          productId: subscription.productId,
          variantId: subscription.variantId,
          productName: subscription.product.name,
          productSku: subscription.product.sku,
          quantity: subscription.quantity,
          price: discountedPrice,
          total: itemTotal,
        },
      },
    },
  });

  // Link order to subscription
  await prisma.subscriptionOrder.create({
    data: {
      productSubscriptionId: subscriptionId,
      orderId: order.id,
      deliveryDate: subscription.nextDeliveryDate,
      status: 'pending',
    },
  });

  // Update subscription with next delivery date
  const nextDeliveryDate = calculateNextDeliveryDate(
    subscription.nextDeliveryDate,
    subscription.frequency
  );

  await prisma.productSubscription.update({
    where: { id: subscriptionId },
    data: {
      nextDeliveryDate,
      lastDeliveryDate: new Date(),
      totalDeliveries: { increment: 1 },
    },
  });

  return order;
}

/**
 * Get premium subscription statistics (admin)
 */
export async function getPremiumSubscriptionStats() {
  const [
    totalActive,
    totalPaused,
    totalCancelled,
    monthlyVsYearly,
    revenueData,
  ] = await Promise.all([
    prisma.premiumSubscription.count({ where: { status: 'active' } }),
    prisma.premiumSubscription.count({ where: { status: 'paused' } }),
    prisma.premiumSubscription.count({ where: { status: 'cancelled' } }),
    prisma.premiumSubscription.groupBy({
      by: ['planType'],
      _count: true,
    }),
    prisma.subscriptionPayment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const planBreakdown = monthlyVsYearly.reduce(
    (acc, item) => {
      acc[item.planType] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    active: totalActive,
    paused: totalPaused,
    cancelled: totalCancelled,
    planBreakdown,
    totalRevenue: Number(revenueData._sum.amount || 0),
    totalPayments: revenueData._count,
  };
}

/**
 * Get product subscription statistics (admin)
 */
export async function getProductSubscriptionStats() {
  const [
    totalActive,
    byFrequency,
    topProducts,
    totalDeliveries,
  ] = await Promise.all([
    prisma.productSubscription.count({ where: { status: 'active' } }),
    prisma.productSubscription.groupBy({
      by: ['frequency'],
      where: { status: 'active' },
      _count: true,
    }),
    prisma.productSubscription.groupBy({
      by: ['productId'],
      where: { status: 'active' },
      _count: true,
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    }),
    prisma.productSubscription.aggregate({
      _sum: { totalDeliveries: true },
    }),
  ]);

  const frequencyBreakdown = byFrequency.reduce(
    (acc, item) => {
      acc[item.frequency] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    active: totalActive,
    frequencyBreakdown,
    topProductIds: topProducts.map((p) => ({
      productId: p.productId,
      count: p._count,
    })),
    totalDeliveries: totalDeliveries._sum.totalDeliveries || 0,
  };
}
