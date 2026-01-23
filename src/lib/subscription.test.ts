import { describe, it, expect } from 'vitest';
import { 
  calculateNextDeliveryDate,
  PREMIUM_PRICING,
  PREMIUM_BENEFITS,
  SUBSCRIBE_SAVE_DISCOUNT,
} from './subscription';
import { addWeeks, addMonths, isAfter } from 'date-fns';

describe('Subscription Service', () => {
  describe('calculateNextDeliveryDate', () => {
    it('should calculate weekly delivery date correctly', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = calculateNextDeliveryDate(fromDate, 'weekly');
      const expected = addWeeks(fromDate, 1);
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate biweekly delivery date correctly', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = calculateNextDeliveryDate(fromDate, 'biweekly');
      const expected = addWeeks(fromDate, 2);
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate monthly delivery date correctly', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = calculateNextDeliveryDate(fromDate, 'monthly');
      const expected = addMonths(fromDate, 1);
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate bimonthly delivery date correctly', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = calculateNextDeliveryDate(fromDate, 'bimonthly');
      const expected = addMonths(fromDate, 2);
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate quarterly delivery date correctly', () => {
      const fromDate = new Date('2024-01-01');
      const nextDate = calculateNextDeliveryDate(fromDate, 'quarterly');
      const expected = addMonths(fromDate, 3);
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should return future date for all frequencies', () => {
      const now = new Date();
      const frequencies = ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'] as const;
      
      frequencies.forEach(frequency => {
        const nextDate = calculateNextDeliveryDate(now, frequency);
        expect(isAfter(nextDate, now)).toBe(true);
      });
    });
  });

  describe('Premium Pricing', () => {
    it('should have correct monthly pricing', () => {
      expect(PREMIUM_PRICING.monthly.price).toBe(99);
      expect(PREMIUM_PRICING.monthly.daysInPeriod).toBe(30);
    });

    it('should have correct yearly pricing', () => {
      expect(PREMIUM_PRICING.yearly.price).toBe(999);
      expect(PREMIUM_PRICING.yearly.daysInPeriod).toBe(365);
    });

    it('should have yearly savings of at least 15%', () => {
      const monthlyYearlyCost = PREMIUM_PRICING.monthly.price * 12;
      const yearlyCost = PREMIUM_PRICING.yearly.price;
      const savings = ((monthlyYearlyCost - yearlyCost) / monthlyYearlyCost) * 100;
      expect(savings).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Premium Benefits', () => {
    it('should include all expected benefits', () => {
      expect(PREMIUM_BENEFITS.freeShipping).toBe(true);
      expect(PREMIUM_BENEFITS.extendedReturns).toBe(14);
      expect(PREMIUM_BENEFITS.loyaltyPointsMultiplier).toBe(2);
      expect(PREMIUM_BENEFITS.prioritySupport).toBe(true);
      expect(PREMIUM_BENEFITS.exclusiveDeals).toBe(true);
      expect(PREMIUM_BENEFITS.earlyAccess).toBe(true);
    });
  });

  describe('Subscribe & Save Discount', () => {
    it('should have correct discount percentage', () => {
      expect(SUBSCRIBE_SAVE_DISCOUNT).toBe(10);
    });

    it('should calculate discounted price correctly', () => {
      const originalPrice = 100;
      const discountedPrice = originalPrice * (1 - SUBSCRIBE_SAVE_DISCOUNT / 100);
      expect(discountedPrice).toBe(90);
    });

    it('should provide meaningful savings', () => {
      expect(SUBSCRIBE_SAVE_DISCOUNT).toBeGreaterThanOrEqual(5);
      expect(SUBSCRIBE_SAVE_DISCOUNT).toBeLessThanOrEqual(20);
    });
  });

  describe('Subscription Frequency Validation', () => {
    it('should handle all valid subscription frequencies', () => {
      const frequencies = ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'] as const;
      const fromDate = new Date();
      
      frequencies.forEach(frequency => {
        const nextDate = calculateNextDeliveryDate(fromDate, frequency);
        expect(nextDate).toBeInstanceOf(Date);
        expect(nextDate.getTime()).toBeGreaterThan(fromDate.getTime());
      });
    });
  });

  describe('Price Calculations', () => {
    it('should calculate subscription item price with discount', () => {
      const basePrice = 50;
      const quantity = 2;
      const discount = SUBSCRIBE_SAVE_DISCOUNT;
      
      const discountedPrice = basePrice * (1 - discount / 100) * quantity;
      expect(discountedPrice).toBe(90);
    });

    it('should maintain precision in price calculations', () => {
      const price = 99.99;
      const discount = SUBSCRIBE_SAVE_DISCOUNT;
      const discounted = Number((price * (1 - discount / 100)).toFixed(2));
      
      expect(discounted).toBe(89.99);
    });
  });
});
