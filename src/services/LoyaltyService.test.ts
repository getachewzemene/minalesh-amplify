import { describe, it, expect } from 'vitest';
import {
  calculateTier,
  calculatePointsFromPurchase,
  calculateRedemptionValue,
  TIER_THRESHOLDS,
  TIER_EARNING_RATES,
  POINTS_TO_CURRENCY_RATE,
} from './LoyaltyService';

describe('LoyaltyService', () => {
  describe('calculateTier', () => {
    it('should return bronze tier for 0 points', () => {
      const result = calculateTier(0);
      expect(result.tier).toBe('bronze');
      expect(result.nextTierPoints).toBe(TIER_THRESHOLDS.silver);
    });

    it('should return bronze tier for points below silver threshold', () => {
      const result = calculateTier(500);
      expect(result.tier).toBe('bronze');
      expect(result.nextTierPoints).toBe(TIER_THRESHOLDS.silver);
    });

    it('should return silver tier for points at silver threshold', () => {
      const result = calculateTier(1000);
      expect(result.tier).toBe('silver');
      expect(result.nextTierPoints).toBe(TIER_THRESHOLDS.gold);
    });

    it('should return silver tier for points between silver and gold', () => {
      const result = calculateTier(3000);
      expect(result.tier).toBe('silver');
      expect(result.nextTierPoints).toBe(TIER_THRESHOLDS.gold);
    });

    it('should return gold tier for points at gold threshold', () => {
      const result = calculateTier(5000);
      expect(result.tier).toBe('gold');
      expect(result.nextTierPoints).toBe(TIER_THRESHOLDS.platinum);
    });

    it('should return platinum tier for points at platinum threshold', () => {
      const result = calculateTier(10000);
      expect(result.tier).toBe('platinum');
      expect(result.nextTierPoints).toBe(0);
    });

    it('should return platinum tier for points above platinum threshold', () => {
      const result = calculateTier(15000);
      expect(result.tier).toBe('platinum');
      expect(result.nextTierPoints).toBe(0);
    });
  });

  describe('calculatePointsFromPurchase', () => {
    it('should calculate bronze tier points correctly', () => {
      // Bronze: 1 point per 10 ETB
      expect(calculatePointsFromPurchase(100, 'bronze')).toBe(10);
      expect(calculatePointsFromPurchase(50, 'bronze')).toBe(5);
      expect(calculatePointsFromPurchase(15, 'bronze')).toBe(1); // floor
    });

    it('should calculate silver tier points correctly', () => {
      // Silver: 1.5 points per 10 ETB
      expect(calculatePointsFromPurchase(100, 'silver')).toBe(15);
      expect(calculatePointsFromPurchase(200, 'silver')).toBe(30);
    });

    it('should calculate gold tier points correctly', () => {
      // Gold: 2 points per 10 ETB
      expect(calculatePointsFromPurchase(100, 'gold')).toBe(20);
      expect(calculatePointsFromPurchase(250, 'gold')).toBe(50);
    });

    it('should calculate platinum tier points correctly', () => {
      // Platinum: 3 points per 10 ETB
      expect(calculatePointsFromPurchase(100, 'platinum')).toBe(30);
      expect(calculatePointsFromPurchase(500, 'platinum')).toBe(150);
    });

    it('should handle decimal amounts and floor the result', () => {
      expect(calculatePointsFromPurchase(99.99, 'bronze')).toBe(9);
      expect(calculatePointsFromPurchase(155, 'silver')).toBe(23); // (155/10) * 1.5 = 23.25 -> 23
    });

    it('should return 0 for very small amounts', () => {
      expect(calculatePointsFromPurchase(5, 'bronze')).toBe(0);
      expect(calculatePointsFromPurchase(9, 'bronze')).toBe(0);
    });
  });

  describe('calculateRedemptionValue', () => {
    it('should calculate redemption value correctly', () => {
      expect(calculateRedemptionValue(100)).toBe(10);
      expect(calculateRedemptionValue(500)).toBe(50);
      expect(calculateRedemptionValue(1000)).toBe(100);
    });

    it('should handle small point amounts', () => {
      expect(calculateRedemptionValue(1)).toBe(0.1);
      expect(calculateRedemptionValue(10)).toBe(1);
    });

    it('should return 0 for 0 points', () => {
      expect(calculateRedemptionValue(0)).toBe(0);
    });

    it('should match the expected rate', () => {
      // 100 points = 10 ETB, so 1 point = 0.1 ETB
      expect(calculateRedemptionValue(1)).toBe(POINTS_TO_CURRENCY_RATE);
    });
  });

  describe('tier thresholds and rates', () => {
    it('should have correct tier thresholds', () => {
      expect(TIER_THRESHOLDS.bronze).toBe(0);
      expect(TIER_THRESHOLDS.silver).toBe(1000);
      expect(TIER_THRESHOLDS.gold).toBe(5000);
      expect(TIER_THRESHOLDS.platinum).toBe(10000);
    });

    it('should have correct earning rates', () => {
      expect(TIER_EARNING_RATES.bronze).toBe(1);
      expect(TIER_EARNING_RATES.silver).toBe(1.5);
      expect(TIER_EARNING_RATES.gold).toBe(2);
      expect(TIER_EARNING_RATES.platinum).toBe(3);
    });

    it('should have correct redemption rate', () => {
      expect(POINTS_TO_CURRENCY_RATE).toBe(0.1);
    });
  });

  describe('integration scenarios', () => {
    it('should calculate correct points for a typical purchase journey', () => {
      // User starts at bronze
      let tier = calculateTier(0);
      expect(tier.tier).toBe('bronze');

      // Makes a 500 ETB purchase
      let points = calculatePointsFromPurchase(500, tier.tier);
      expect(points).toBe(50); // 500/10 * 1 = 50 points

      // After several purchases, reaches 1000 points
      tier = calculateTier(1000);
      expect(tier.tier).toBe('silver');

      // Makes another 500 ETB purchase at silver tier
      points = calculatePointsFromPurchase(500, tier.tier);
      expect(points).toBe(75); // 500/10 * 1.5 = 75 points
    });

    it('should validate redemption scenario', () => {
      // User has 500 points
      const redemptionValue = calculateRedemptionValue(500);
      expect(redemptionValue).toBe(50); // 500 * 0.1 = 50 ETB discount
    });
  });
});
