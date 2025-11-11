import { Decimal } from '@prisma/client/runtime/library';

export interface PricingContext {
  productId: string;
  basePrice: number;
  quantity: number;
  categoryId?: string;
}

export interface DiscountResult {
  type: 'coupon' | 'promotion' | 'tiered' | 'flash';
  name: string;
  amount: number;
  percentage?: number;
}

export interface PricingResult {
  originalPrice: number;
  discountedPrice: number;
  totalDiscount: number;
  appliedDiscounts: DiscountResult[];
}

/**
 * Apply percentage discount to a price
 */
export function applyPercentageDiscount(
  price: number,
  percentage: number,
  maxDiscount?: number
): number {
  const discountAmount = (price * percentage) / 100;
  if (maxDiscount && discountAmount > maxDiscount) {
    return maxDiscount;
  }
  return discountAmount;
}

/**
 * Apply fixed amount discount to a price
 */
export function applyFixedDiscount(
  price: number,
  fixedAmount: number
): number {
  return Math.min(fixedAmount, price);
}

/**
 * Calculate tiered pricing discount based on quantity
 */
export function calculateTieredDiscount(
  basePrice: number,
  quantity: number,
  tiers: Array<{
    minQuantity: number;
    maxQuantity: number | null;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: Decimal;
  }>
): number {
  // Find applicable tier
  const applicableTier = tiers.find(
    (tier) =>
      quantity >= tier.minQuantity &&
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
  );

  if (!applicableTier) {
    return 0;
  }

  const discountValue = Number(applicableTier.discountValue);
  const totalPrice = basePrice * quantity;

  if (applicableTier.discountType === 'percentage') {
    return (totalPrice * discountValue) / 100;
  } else {
    return discountValue * quantity;
  }
}

/**
 * Calculate total price with all applicable discounts
 */
export function calculateTotalPrice(
  context: PricingContext,
  discounts: DiscountResult[] = []
): PricingResult {
  const originalPrice = context.basePrice * context.quantity;
  const totalDiscount = discounts.reduce(
    (sum, discount) => sum + discount.amount,
    0
  );
  const discountedPrice = Math.max(0, originalPrice - totalDiscount);

  return {
    originalPrice,
    discountedPrice,
    totalDiscount,
    appliedDiscounts: discounts,
  };
}

/**
 * Check if a flash sale is currently active
 */
export function isFlashSaleActive(
  startsAt: Date,
  endsAt: Date,
  stockLimit?: number,
  stockSold?: number
): boolean {
  const now = new Date();
  const isWithinTimeRange = now >= startsAt && now <= endsAt;

  if (!isWithinTimeRange) {
    return false;
  }

  if (stockLimit && stockSold !== undefined) {
    return stockSold < stockLimit;
  }

  return true;
}

/**
 * Check if a promotion is currently active
 */
export function isPromotionActive(
  startsAt: Date,
  endsAt: Date | null,
  isActive: boolean
): boolean {
  if (!isActive) {
    return false;
  }

  const now = new Date();
  const hasStarted = now >= startsAt;
  const hasNotEnded = !endsAt || now <= endsAt;

  return hasStarted && hasNotEnded;
}

/**
 * Calculate cart subtotal
 */
export function calculateCartSubtotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Apply multiple discounts and calculate final price
 * Discounts are applied in order of priority
 */
export function applyDiscounts(
  originalPrice: number,
  discounts: Array<{
    type: 'percentage' | 'fixed_amount';
    value: number;
    maxDiscount?: number;
  }>
): number {
  let finalPrice = originalPrice;

  for (const discount of discounts) {
    if (discount.type === 'percentage') {
      const discountAmount = applyPercentageDiscount(
        finalPrice,
        discount.value,
        discount.maxDiscount
      );
      finalPrice -= discountAmount;
    } else {
      const discountAmount = applyFixedDiscount(finalPrice, discount.value);
      finalPrice -= discountAmount;
    }
  }

  return Math.max(0, finalPrice);
}
