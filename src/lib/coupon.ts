import prisma from './prisma';
import { applyPercentageDiscount, applyFixedDiscount } from './pricing';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minimumPurchase?: number;
    maximumDiscount?: number;
  };
  error?: string;
  discountAmount?: number;
}

/**
 * Validate a coupon code and calculate discount
 */
export async function validateCoupon(
  code: string,
  userId: string | null,
  subtotal: number
): Promise<CouponValidationResult> {
  // Find coupon by code
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return {
      valid: false,
      error: 'Invalid coupon code',
    };
  }

  // Check if coupon is active
  if (coupon.status !== 'active') {
    return {
      valid: false,
      error: 'This coupon is no longer active',
    };
  }

  // Check expiration date
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return {
      valid: false,
      error: 'This coupon has expired',
    };
  }

  // Check start date
  if (coupon.startsAt && new Date() < coupon.startsAt) {
    return {
      valid: false,
      error: 'This coupon is not yet active',
    };
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      error: 'This coupon has reached its usage limit',
    };
  }

  // Check per-user limit
  if (userId && coupon.perUserLimit) {
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return {
        valid: false,
        error: 'You have already used this coupon the maximum number of times',
      };
    }
  }

  // Check minimum purchase
  if (coupon.minimumPurchase && subtotal < Number(coupon.minimumPurchase)) {
    return {
      valid: false,
      error: `Minimum purchase of ${Number(coupon.minimumPurchase)} ETB required`,
    };
  }

  // Calculate discount amount
  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    const percentageValue = Number(coupon.discountValue);
    const maxDiscount = coupon.maximumDiscount
      ? Number(coupon.maximumDiscount)
      : undefined;
    discountAmount = applyPercentageDiscount(
      subtotal,
      percentageValue,
      maxDiscount
    );
  } else if (coupon.discountType === 'fixed_amount') {
    discountAmount = applyFixedDiscount(subtotal, Number(coupon.discountValue));
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase
        ? Number(coupon.minimumPurchase)
        : undefined,
      maximumDiscount: coupon.maximumDiscount
        ? Number(coupon.maximumDiscount)
        : undefined,
    },
    discountAmount,
  };
}

/**
 * Record coupon usage when an order is placed
 */
export async function recordCouponUsage(
  couponId: string,
  orderId: string,
  userId: string | null,
  discountAmount: number
): Promise<void> {
  await prisma.$transaction([
    // Create coupon usage record
    prisma.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId,
        discountAmount,
      },
    }),
    // Increment usage count
    prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    }),
  ]);
}

/**
 * Check if coupon provides free shipping
 */
export function isFreeShippingCoupon(discountType: string): boolean {
  return discountType === 'free_shipping';
}
