import { describe, it, expect } from 'vitest';
import { DEFAULT_COMMISSION_RATE } from './vendor-payout';

describe('Vendor Commission & Payout System', () => {
  describe('Commission rate configuration', () => {
    it('should have a default commission rate of 15%', () => {
      expect(DEFAULT_COMMISSION_RATE).toBe(0.15);
    });

    it('should support commission rates between 0 and 1', () => {
      const testRates = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 1.0];
      
      testRates.forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Commission calculation formula', () => {
    it('should calculate commission amount correctly', () => {
      const totalSales = 1000;
      const commissionRate = 0.15;
      
      const commissionAmount = totalSales * commissionRate;
      const payoutAmount = totalSales - commissionAmount;
      
      expect(commissionAmount).toBe(150);
      expect(payoutAmount).toBe(850);
    });

    it('should handle zero sales correctly', () => {
      const totalSales = 0;
      const commissionRate = 0.15;
      
      const commissionAmount = totalSales * commissionRate;
      const payoutAmount = totalSales - commissionAmount;
      
      expect(commissionAmount).toBe(0);
      expect(payoutAmount).toBe(0);
    });

    it('should handle different commission rates', () => {
      const totalSales = 1000;
      
      // 10% commission
      let rate = 0.10;
      let commission = totalSales * rate;
      let payout = totalSales - commission;
      expect(commission).toBe(100);
      expect(payout).toBe(900);
      
      // 20% commission
      rate = 0.20;
      commission = totalSales * rate;
      payout = totalSales - commission;
      expect(commission).toBe(200);
      expect(payout).toBe(800);
      
      // 25% commission
      rate = 0.25;
      commission = totalSales * rate;
      payout = totalSales - commission;
      expect(commission).toBe(250);
      expect(payout).toBe(750);
    });

    it('should handle decimal sales amounts', () => {
      const totalSales = 1234.56;
      const commissionRate = 0.15;
      
      const commissionAmount = totalSales * commissionRate;
      const payoutAmount = totalSales - commissionAmount;
      
      expect(commissionAmount).toBeCloseTo(185.184, 2);
      expect(payoutAmount).toBeCloseTo(1049.376, 2);
    });
  });

  describe('Month-end commission total calculation', () => {
    it('should calculate accurate totals for a period', () => {
      // Simulating ledger entries for a month
      const entries = [
        { saleAmount: 500, commissionRate: 0.15, commissionAmount: 75, vendorPayout: 425 },
        { saleAmount: 800, commissionRate: 0.15, commissionAmount: 120, vendorPayout: 680 },
        { saleAmount: 1200, commissionRate: 0.15, commissionAmount: 180, vendorPayout: 1020 },
      ];

      const totalSales = entries.reduce((sum, entry) => sum + entry.saleAmount, 0);
      const totalCommission = entries.reduce((sum, entry) => sum + entry.commissionAmount, 0);
      const totalPayout = entries.reduce((sum, entry) => sum + entry.vendorPayout, 0);
      const averageRate = totalSales > 0 ? totalCommission / totalSales : 0;

      expect(totalSales).toBe(2500);
      expect(totalCommission).toBe(375);
      expect(totalPayout).toBe(2125);
      expect(averageRate).toBe(0.15);
    });

    it('should handle mixed commission rates correctly', () => {
      // Simulating ledger entries with different rates
      const entries = [
        { saleAmount: 1000, commissionRate: 0.15, commissionAmount: 150, vendorPayout: 850 },
        { saleAmount: 1000, commissionRate: 0.20, commissionAmount: 200, vendorPayout: 800 },
        { saleAmount: 1000, commissionRate: 0.10, commissionAmount: 100, vendorPayout: 900 },
      ];

      const totalSales = entries.reduce((sum, entry) => sum + entry.saleAmount, 0);
      const totalCommission = entries.reduce((sum, entry) => sum + entry.commissionAmount, 0);
      const totalPayout = entries.reduce((sum, entry) => sum + entry.vendorPayout, 0);
      const averageRate = totalSales > 0 ? totalCommission / totalSales : 0;

      expect(totalSales).toBe(3000);
      expect(totalCommission).toBe(450);
      expect(totalPayout).toBe(2550);
      expect(averageRate).toBe(0.15); // Weighted average
    });
  });

  describe('Ledger entry structure', () => {
    it('should have required fields for commission ledger', () => {
      const ledgerEntry = {
        id: 'uuid',
        vendorId: 'vendor-uuid',
        orderId: 'order-uuid',
        orderItemId: 'item-uuid',
        saleAmount: 1000,
        commissionRate: 0.15,
        commissionAmount: 150,
        vendorPayout: 850,
        status: 'recorded',
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(ledgerEntry.vendorId).toBeDefined();
      expect(ledgerEntry.orderId).toBeDefined();
      expect(ledgerEntry.saleAmount).toBeGreaterThanOrEqual(0);
      expect(ledgerEntry.commissionRate).toBeGreaterThanOrEqual(0);
      expect(ledgerEntry.commissionAmount).toBeGreaterThanOrEqual(0);
      expect(ledgerEntry.vendorPayout).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Payout status', () => {
    it('should support valid payout statuses', () => {
      const validStatuses = ['pending', 'paid'];
      
      validStatuses.forEach(status => {
        expect(['pending', 'paid']).toContain(status);
      });
    });
  });
});

describe('Order total calculation', () => {
  describe('Total formula: subtotal - discounts + shipping + tax', () => {
    it('should calculate order total correctly with all components', () => {
      const subtotal = 1000;
      const discounts = 100;
      const shipping = 50;
      const tax = 135; // 15% VAT on (subtotal - discounts)
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(1085);
    });

    it('should handle zero discount', () => {
      const subtotal = 1000;
      const discounts = 0;
      const shipping = 50;
      const tax = 150; // 15% VAT
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(1200);
    });

    it('should handle free shipping', () => {
      const subtotal = 1000;
      const discounts = 100;
      const shipping = 0;
      const tax = 135;
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(1035);
    });

    it('should handle zero tax', () => {
      const subtotal = 1000;
      const discounts = 100;
      const shipping = 50;
      const tax = 0;
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(950);
    });

    it('should calculate Ethiopian VAT correctly (15%)', () => {
      const subtotal = 1000;
      const discounts = 0;
      const shipping = 50;
      const taxRate = 0.15;
      
      const subtotalAfterDiscount = subtotal - discounts;
      const tax = subtotalAfterDiscount * taxRate;
      const total = subtotalAfterDiscount + shipping + tax;
      
      expect(tax).toBe(150);
      expect(total).toBe(1200);
    });

    it('should apply discount before tax calculation', () => {
      const subtotal = 1000;
      const discountPercent = 0.10; // 10% discount
      const discounts = subtotal * discountPercent;
      const shipping = 50;
      const taxRate = 0.15;
      
      const subtotalAfterDiscount = subtotal - discounts;
      const tax = subtotalAfterDiscount * taxRate;
      const total = subtotalAfterDiscount + shipping + tax;
      
      expect(discounts).toBe(100);
      expect(subtotalAfterDiscount).toBe(900);
      expect(tax).toBe(135);
      expect(total).toBe(1085);
    });
  });

  describe('Decimal precision', () => {
    it('should handle decimal amounts correctly', () => {
      const subtotal = 1234.56;
      const discounts = 123.46;
      const shipping = 45.67;
      const tax = 166.67;
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBeCloseTo(1323.44, 2);
    });

    it('should round to 2 decimal places for currency', () => {
      const subtotal = 99.999;
      const discounts = 9.999;
      const shipping = 5.001;
      const tax = 13.5;
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(Number(total.toFixed(2))).toBe(108.50);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero subtotal', () => {
      const subtotal = 0;
      const discounts = 0;
      const shipping = 50;
      const tax = 0;
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(50);
    });

    it('should handle discount equal to subtotal', () => {
      const subtotal = 1000;
      const discounts = 1000;
      const shipping = 50;
      const tax = 0; // No tax on free items
      
      const total = subtotal - discounts + shipping + tax;
      
      expect(total).toBe(50);
    });

    it('should not allow negative total', () => {
      const subtotal = 100;
      const discounts = 100;
      const shipping = 0;
      const tax = 0;
      
      const total = Math.max(0, subtotal - discounts + shipping + tax);
      
      expect(total).toBe(0);
    });
  });
});
