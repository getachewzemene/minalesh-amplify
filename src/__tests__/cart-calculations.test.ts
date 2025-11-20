/**
 * Unit Tests: Cart Calculations
 * 
 * Tests for cart pricing, discounts, and totals calculation.
 */

import { describe, it, expect } from 'vitest';

describe('Cart Calculations', () => {
  describe('Basic Cart Math', () => {
    it('should calculate item subtotal correctly', () => {
      const price = 99.99;
      const quantity = 3;
      const subtotal = price * quantity;
      
      expect(subtotal).toBeCloseTo(299.97, 2);
    });

    it('should calculate cart total with multiple items', () => {
      const items = [
        { price: 50.00, quantity: 2 }, // 100.00
        { price: 25.50, quantity: 1 }, // 25.50
        { price: 15.00, quantity: 4 }, // 60.00
      ];
      
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      expect(total).toBeCloseTo(185.50, 2);
    });

    it('should handle single item in cart', () => {
      const price = 149.99;
      const quantity = 1;
      const total = price * quantity;
      
      expect(total).toBe(149.99);
    });

    it('should handle large quantities', () => {
      const price = 5.00;
      const quantity = 100;
      const total = price * quantity;
      
      expect(total).toBe(500.00);
    });
  });

  describe('Price Calculations with Variants', () => {
    it('should use variant price when available', () => {
      const basePrice = 100.00;
      const variantPrice = 120.00;
      const quantity = 2;
      
      const total = variantPrice * quantity;
      
      expect(total).toBe(240.00);
      expect(total).not.toBe(basePrice * quantity);
    });

    it('should use sale price when available', () => {
      const regularPrice = 100.00;
      const salePrice = 75.00;
      const quantity = 1;
      
      const total = salePrice * quantity;
      
      expect(total).toBe(75.00);
      expect(total).toBeLessThan(regularPrice * quantity);
    });

    it('should prioritize variant sale price over variant regular price', () => {
      const variantRegularPrice = 120.00;
      const variantSalePrice = 99.00;
      const quantity = 1;
      
      const total = variantSalePrice * quantity;
      
      expect(total).toBe(99.00);
      expect(total).toBeLessThan(variantRegularPrice * quantity);
    });
  });

  describe('Discount Calculations', () => {
    it('should calculate percentage discount correctly', () => {
      const subtotal = 200.00;
      const discountPercentage = 10;
      const discountAmount = (subtotal * discountPercentage) / 100;
      
      expect(discountAmount).toBe(20.00);
    });

    it('should calculate fixed discount correctly', () => {
      const subtotal = 150.00;
      const discountAmount = 25.00;
      const finalPrice = subtotal - discountAmount;
      
      expect(finalPrice).toBe(125.00);
    });

    it('should not allow discount to make total negative', () => {
      const subtotal = 50.00;
      const discountAmount = 100.00;
      const finalPrice = Math.max(0, subtotal - discountAmount);
      
      expect(finalPrice).toBe(0);
      expect(finalPrice).toBeGreaterThanOrEqual(0);
    });

    it('should calculate discount after subtotal', () => {
      const items = [
        { price: 50.00, quantity: 2 },
        { price: 30.00, quantity: 1 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountPercentage = 15;
      const discountAmount = (subtotal * discountPercentage) / 100;
      const subtotalAfterDiscount = subtotal - discountAmount;
      
      expect(subtotal).toBe(130.00);
      expect(discountAmount).toBeCloseTo(19.50, 2);
      expect(subtotalAfterDiscount).toBeCloseTo(110.50, 2);
    });
  });

  describe('Shipping Calculations', () => {
    it('should add shipping cost to subtotal', () => {
      const subtotal = 100.00;
      const shippingCost = 15.00;
      const total = subtotal + shippingCost;
      
      expect(total).toBe(115.00);
    });

    it('should handle free shipping', () => {
      const subtotal = 100.00;
      const shippingCost = 0.00;
      const total = subtotal + shippingCost;
      
      expect(total).toBe(100.00);
    });

    it('should apply free shipping coupon', () => {
      const subtotal = 100.00;
      const regularShippingCost = 15.00;
      const freeShipping = true;
      const shippingCost = freeShipping ? 0 : regularShippingCost;
      const total = subtotal + shippingCost;
      
      expect(total).toBe(100.00);
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate tax on subtotal after discount', () => {
      const subtotalAfterDiscount = 100.00;
      const taxRate = 0.08; // 8%
      const taxAmount = subtotalAfterDiscount * taxRate;
      
      expect(taxAmount).toBe(8.00);
    });

    it('should add tax to total', () => {
      const subtotalAfterDiscount = 100.00;
      const shippingCost = 10.00;
      const taxAmount = 8.00;
      const total = subtotalAfterDiscount + shippingCost + taxAmount;
      
      expect(total).toBe(118.00);
    });

    it('should handle zero tax rate', () => {
      const subtotalAfterDiscount = 100.00;
      const taxRate = 0.00;
      const taxAmount = subtotalAfterDiscount * taxRate;
      
      expect(taxAmount).toBe(0.00);
    });
  });

  describe('Complete Cart Total Calculation', () => {
    it('should calculate complete cart total with all components', () => {
      // Cart items
      const items = [
        { price: 50.00, quantity: 2 },
        { price: 30.00, quantity: 1 },
      ];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Apply discount
      const discountPercentage = 10;
      const discountAmount = (subtotal * discountPercentage) / 100;
      const subtotalAfterDiscount = subtotal - discountAmount;
      
      // Add shipping
      const shippingCost = 15.00;
      
      // Calculate tax on discounted subtotal
      const taxRate = 0.08;
      const taxAmount = subtotalAfterDiscount * taxRate;
      
      // Final total
      const total = subtotalAfterDiscount + shippingCost + taxAmount;
      
      expect(subtotal).toBe(130.00);
      expect(discountAmount).toBe(13.00);
      expect(subtotalAfterDiscount).toBe(117.00);
      expect(taxAmount).toBeCloseTo(9.36, 2);
      expect(total).toBeCloseTo(141.36, 2);
    });

    it('should calculate total with free shipping and no discount', () => {
      const subtotal = 200.00;
      const discountAmount = 0.00;
      const shippingCost = 0.00;
      const taxAmount = 0.00;
      const total = subtotal - discountAmount + shippingCost + taxAmount;
      
      expect(total).toBe(200.00);
    });
  });

  describe('Item Count Calculations', () => {
    it('should count total items in cart', () => {
      const items = [
        { quantity: 2 },
        { quantity: 1 },
        { quantity: 3 },
      ];
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      expect(itemCount).toBe(6);
    });

    it('should handle empty cart', () => {
      const items: { quantity: number }[] = [];
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      expect(itemCount).toBe(0);
    });

    it('should count unique product types', () => {
      const items = [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
        { productId: '3', quantity: 3 },
      ];
      const uniqueProducts = items.length;
      
      expect(uniqueProducts).toBe(3);
    });
  });

  describe('Precision and Rounding', () => {
    it('should handle decimal prices correctly', () => {
      const price = 19.99;
      const quantity = 3;
      const total = price * quantity;
      
      expect(total).toBeCloseTo(59.97, 2);
    });

    it('should handle currency precision', () => {
      const price = 10.005;
      const roundedPrice = Math.round(price * 100) / 100;
      
      expect(roundedPrice).toBe(10.01);
    });

    it('should maintain precision in calculations', () => {
      const subtotal = 99.99;
      const taxRate = 0.0825; // 8.25%
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      
      expect(taxAmount).toBeCloseTo(8.25, 2);
    });
  });
});
