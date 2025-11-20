/**
 * Unit Tests: Promotions Engine
 * 
 * Tests for promotions, flash sales, and discount application logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  applyPercentageDiscount,
  applyFixedDiscount,
  calculateTieredDiscount,
  isFlashSaleActive,
  isPromotionActive,
  applyDiscounts,
} from '@/lib/pricing';
import { Decimal } from '@prisma/client/runtime/library';

describe('Promotions Engine', () => {
  describe('Percentage Discount', () => {
    it('should apply basic percentage discount', () => {
      const discount = applyPercentageDiscount(100, 20);
      expect(discount).toBe(20);
    });

    it('should calculate discount for various percentages', () => {
      expect(applyPercentageDiscount(200, 10)).toBe(20);
      expect(applyPercentageDiscount(150, 33)).toBeCloseTo(49.5, 1);
      expect(applyPercentageDiscount(500, 5)).toBe(25);
    });

    it('should respect maximum discount limit', () => {
      const discount = applyPercentageDiscount(1000, 50, 100);
      expect(discount).toBe(100);
    });

    it('should not apply max discount if calculated discount is lower', () => {
      const discount = applyPercentageDiscount(100, 10, 50);
      expect(discount).toBe(10);
    });

    it('should handle zero percentage', () => {
      const discount = applyPercentageDiscount(100, 0);
      expect(discount).toBe(0);
    });

    it('should handle 100% discount', () => {
      const discount = applyPercentageDiscount(100, 100);
      expect(discount).toBe(100);
    });
  });

  describe('Fixed Amount Discount', () => {
    it('should apply basic fixed discount', () => {
      const discount = applyFixedDiscount(100, 25);
      expect(discount).toBe(25);
    });

    it('should not exceed product price', () => {
      const discount = applyFixedDiscount(50, 100);
      expect(discount).toBe(50);
    });

    it('should handle exact price match', () => {
      const discount = applyFixedDiscount(75, 75);
      expect(discount).toBe(75);
    });

    it('should handle zero discount', () => {
      const discount = applyFixedDiscount(100, 0);
      expect(discount).toBe(0);
    });
  });

  describe('Tiered Pricing Discount', () => {
    it('should apply discount for quantity tier', () => {
      const tiers = [
        {
          minQuantity: 1,
          maxQuantity: 9,
          discountType: 'percentage' as const,
          discountValue: new Decimal(0),
        },
        {
          minQuantity: 10,
          maxQuantity: 49,
          discountType: 'percentage' as const,
          discountValue: new Decimal(10),
        },
        {
          minQuantity: 50,
          maxQuantity: null,
          discountType: 'percentage' as const,
          discountValue: new Decimal(20),
        },
      ];

      // 5 items - no discount tier
      expect(calculateTieredDiscount(10, 5, tiers)).toBe(0);

      // 15 items - 10% discount tier
      expect(calculateTieredDiscount(10, 15, tiers)).toBe(15);

      // 60 items - 20% discount tier
      expect(calculateTieredDiscount(10, 60, tiers)).toBe(120);
    });

    it('should apply fixed amount tiered discount', () => {
      const tiers = [
        {
          minQuantity: 10,
          maxQuantity: null,
          discountType: 'fixed_amount' as const,
          discountValue: new Decimal(2),
        },
      ];

      const discount = calculateTieredDiscount(10, 15, tiers);
      expect(discount).toBe(30); // $2 off per item * 15 items
    });

    it('should return zero when no tier matches', () => {
      const tiers = [
        {
          minQuantity: 10,
          maxQuantity: null,
          discountType: 'percentage' as const,
          discountValue: new Decimal(10),
        },
      ];

      const discount = calculateTieredDiscount(10, 5, tiers);
      expect(discount).toBe(0);
    });

    it('should handle multiple tiers correctly', () => {
      const tiers = [
        {
          minQuantity: 5,
          maxQuantity: 9,
          discountType: 'percentage' as const,
          discountValue: new Decimal(5),
        },
        {
          minQuantity: 10,
          maxQuantity: 19,
          discountType: 'percentage' as const,
          discountValue: new Decimal(10),
        },
        {
          minQuantity: 20,
          maxQuantity: null,
          discountType: 'percentage' as const,
          discountValue: new Decimal(15),
        },
      ];

      expect(calculateTieredDiscount(100, 7, tiers)).toBeCloseTo(35, 2); // 5% of 700
      expect(calculateTieredDiscount(100, 12, tiers)).toBeCloseTo(120, 2); // 10% of 1200
      expect(calculateTieredDiscount(100, 25, tiers)).toBeCloseTo(375, 2); // 15% of 2500
    });
  });

  describe('Flash Sale Active Status', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be active when within time range', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');

      expect(isFlashSaleActive(startsAt, endsAt)).toBe(true);
    });

    it('should be inactive before start time', () => {
      const now = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');

      expect(isFlashSaleActive(startsAt, endsAt)).toBe(false);
    });

    it('should be inactive after end time', () => {
      const now = new Date('2024-01-15T15:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');

      expect(isFlashSaleActive(startsAt, endsAt)).toBe(false);
    });

    it('should be inactive when stock limit reached', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const stockLimit = 100;
      const stockSold = 100;

      expect(isFlashSaleActive(startsAt, endsAt, stockLimit, stockSold)).toBe(false);
    });

    it('should be active when stock still available', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const stockLimit = 100;
      const stockSold = 50;

      expect(isFlashSaleActive(startsAt, endsAt, stockLimit, stockSold)).toBe(true);
    });

    it('should be active at exact start time', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');

      expect(isFlashSaleActive(startsAt, endsAt)).toBe(true);
    });

    it('should be active at exact end time', () => {
      const now = new Date('2024-01-15T14:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');

      expect(isFlashSaleActive(startsAt, endsAt)).toBe(true);
    });
  });

  describe('Promotion Active Status', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be active when all conditions met', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const isActive = true;

      expect(isPromotionActive(startsAt, endsAt, isActive)).toBe(true);
    });

    it('should be inactive when disabled', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const isActive = false;

      expect(isPromotionActive(startsAt, endsAt, isActive)).toBe(false);
    });

    it('should be inactive before start date', () => {
      const now = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const isActive = true;

      expect(isPromotionActive(startsAt, endsAt, isActive)).toBe(false);
    });

    it('should be inactive after end date', () => {
      const now = new Date('2024-01-15T15:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = new Date('2024-01-15T14:00:00Z');
      const isActive = true;

      expect(isPromotionActive(startsAt, endsAt, isActive)).toBe(false);
    });

    it('should be active with no end date', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const startsAt = new Date('2024-01-15T10:00:00Z');
      const endsAt = null;
      const isActive = true;

      expect(isPromotionActive(startsAt, endsAt, isActive)).toBe(true);
    });
  });

  describe('Multiple Discount Application', () => {
    it('should apply multiple percentage discounts sequentially', () => {
      const originalPrice = 100;
      const discounts = [
        { type: 'percentage' as const, value: 10 },
        { type: 'percentage' as const, value: 20 },
      ];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      // First: 100 - 10% = 90
      // Second: 90 - 20% = 72
      expect(finalPrice).toBe(72);
    });

    it('should apply multiple fixed discounts sequentially', () => {
      const originalPrice = 100;
      const discounts = [
        { type: 'fixed_amount' as const, value: 15 },
        { type: 'fixed_amount' as const, value: 10 },
      ];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      // First: 100 - 15 = 85
      // Second: 85 - 10 = 75
      expect(finalPrice).toBe(75);
    });

    it('should apply mixed discount types', () => {
      const originalPrice = 200;
      const discounts = [
        { type: 'percentage' as const, value: 25 },
        { type: 'fixed_amount' as const, value: 20 },
      ];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      // First: 200 - 25% = 150
      // Second: 150 - 20 = 130
      expect(finalPrice).toBe(130);
    });

    it('should not allow negative prices', () => {
      const originalPrice = 50;
      const discounts = [
        { type: 'fixed_amount' as const, value: 40 },
        { type: 'fixed_amount' as const, value: 30 },
      ];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      expect(finalPrice).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty discounts array', () => {
      const originalPrice = 100;
      const discounts: Array<{ type: 'percentage' | 'fixed_amount'; value: number }> = [];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      expect(finalPrice).toBe(100);
    });

    it('should respect max discount limits', () => {
      const originalPrice = 1000;
      const discounts = [
        { type: 'percentage' as const, value: 50, maxDiscount: 100 },
      ];

      const finalPrice = applyDiscounts(originalPrice, discounts);
      
      // 50% of 1000 = 500, but max is 100
      // Final: 1000 - 100 = 900
      expect(finalPrice).toBe(900);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', () => {
      const discount = applyPercentageDiscount(0, 10);
      expect(discount).toBe(0);
    });

    it('should handle very small prices', () => {
      const discount = applyPercentageDiscount(0.01, 10);
      expect(discount).toBeCloseTo(0.001, 3);
    });

    it('should handle very large prices', () => {
      const discount = applyPercentageDiscount(1000000, 10);
      expect(discount).toBe(100000);
    });

    it('should handle decimal percentages', () => {
      const discount = applyPercentageDiscount(100, 12.5);
      expect(discount).toBe(12.5);
    });
  });
});
