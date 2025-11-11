import { describe, it, expect } from 'vitest';
import {
  applyPercentageDiscount,
  applyFixedDiscount,
  calculateCartSubtotal,
  applyDiscounts,
  isFlashSaleActive,
  isPromotionActive,
} from './pricing';

describe('Pricing utilities', () => {
  describe('applyPercentageDiscount', () => {
    it('should apply percentage discount correctly', () => {
      expect(applyPercentageDiscount(100, 10)).toBe(10);
      expect(applyPercentageDiscount(200, 25)).toBe(50);
      expect(applyPercentageDiscount(150, 20)).toBe(30);
    });

    it('should respect maximum discount limit', () => {
      expect(applyPercentageDiscount(1000, 50, 100)).toBe(100);
      expect(applyPercentageDiscount(500, 30, 100)).toBe(100);
    });

    it('should not apply max discount if discount is lower', () => {
      expect(applyPercentageDiscount(100, 10, 50)).toBe(10);
    });
  });

  describe('applyFixedDiscount', () => {
    it('should apply fixed discount correctly', () => {
      expect(applyFixedDiscount(100, 20)).toBe(20);
      expect(applyFixedDiscount(50, 10)).toBe(10);
    });

    it('should not exceed the price', () => {
      expect(applyFixedDiscount(50, 100)).toBe(50);
      expect(applyFixedDiscount(30, 50)).toBe(30);
    });
  });

  describe('calculateCartSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
        { price: 75, quantity: 1 },
      ];
      expect(calculateCartSubtotal(items)).toBe(425);
    });

    it('should handle empty cart', () => {
      expect(calculateCartSubtotal([])).toBe(0);
    });

    it('should handle single item', () => {
      expect(calculateCartSubtotal([{ price: 100, quantity: 1 }])).toBe(100);
    });
  });

  describe('applyDiscounts', () => {
    it('should apply multiple percentage discounts', () => {
      const result = applyDiscounts(100, [
        { type: 'percentage', value: 10 },
        { type: 'percentage', value: 5 },
      ]);
      // 100 - 10% = 90, 90 - 5% = 85.5
      expect(result).toBe(85.5);
    });

    it('should apply multiple fixed discounts', () => {
      const result = applyDiscounts(100, [
        { type: 'fixed_amount', value: 20 },
        { type: 'fixed_amount', value: 10 },
      ]);
      expect(result).toBe(70);
    });

    it('should apply mixed discounts', () => {
      const result = applyDiscounts(100, [
        { type: 'percentage', value: 10 },
        { type: 'fixed_amount', value: 15 },
      ]);
      // 100 - 10% = 90, 90 - 15 = 75
      expect(result).toBe(75);
    });

    it('should not go below zero', () => {
      const result = applyDiscounts(50, [
        { type: 'fixed_amount', value: 60 },
      ]);
      expect(result).toBe(0);
    });
  });

  describe('isFlashSaleActive', () => {
    it('should return true for active flash sale', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000); // 1 hour ago
      const endsAt = new Date(now.getTime() + 3600000); // 1 hour from now
      expect(isFlashSaleActive(startsAt, endsAt)).toBe(true);
    });

    it('should return false for expired flash sale', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 7200000); // 2 hours ago
      const endsAt = new Date(now.getTime() - 3600000); // 1 hour ago
      expect(isFlashSaleActive(startsAt, endsAt)).toBe(false);
    });

    it('should return false for future flash sale', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() + 3600000); // 1 hour from now
      const endsAt = new Date(now.getTime() + 7200000); // 2 hours from now
      expect(isFlashSaleActive(startsAt, endsAt)).toBe(false);
    });

    it('should check stock limit', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      const endsAt = new Date(now.getTime() + 3600000);
      expect(isFlashSaleActive(startsAt, endsAt, 10, 5)).toBe(true);
      expect(isFlashSaleActive(startsAt, endsAt, 10, 10)).toBe(false);
      expect(isFlashSaleActive(startsAt, endsAt, 10, 15)).toBe(false);
    });
  });

  describe('isPromotionActive', () => {
    it('should return true for active promotion', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      const endsAt = new Date(now.getTime() + 3600000);
      expect(isPromotionActive(startsAt, endsAt, true)).toBe(true);
    });

    it('should return false for inactive promotion', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      const endsAt = new Date(now.getTime() + 3600000);
      expect(isPromotionActive(startsAt, endsAt, false)).toBe(false);
    });

    it('should handle null end date', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 3600000);
      expect(isPromotionActive(startsAt, null, true)).toBe(true);
    });

    it('should return false for expired promotion', () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() - 7200000);
      const endsAt = new Date(now.getTime() - 3600000);
      expect(isPromotionActive(startsAt, endsAt, true)).toBe(false);
    });
  });
});
