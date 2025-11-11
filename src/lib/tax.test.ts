import { describe, it, expect } from 'vitest';
import {
  calculateEthiopianVAT,
  isVATExemptInEthiopia,
  formatTaxRate,
  calculateTotalWithTax,
} from './tax';

describe('Tax utilities', () => {
  describe('calculateEthiopianVAT', () => {
    it('should calculate 15% VAT correctly', () => {
      const result = calculateEthiopianVAT(100);
      expect(result.totalTaxAmount).toBe(15);
      expect(result.subtotalWithTax).toBe(115);
      expect(result.taxes).toHaveLength(1);
      expect(result.taxes[0].rate).toBe(0.15);
      expect(result.taxes[0].taxType).toBe('VAT');
    });

    it('should calculate VAT for different amounts', () => {
      expect(calculateEthiopianVAT(200).totalTaxAmount).toBe(30);
      expect(calculateEthiopianVAT(500).totalTaxAmount).toBe(75);
      expect(calculateEthiopianVAT(1000).totalTaxAmount).toBe(150);
    });

    it('should handle decimal amounts', () => {
      const result = calculateEthiopianVAT(99.99);
      expect(result.totalTaxAmount).toBeCloseTo(14.9985, 2);
    });
  });

  describe('isVATExemptInEthiopia', () => {
    it('should identify exempt categories', () => {
      expect(isVATExemptInEthiopia('basic-food')).toBe(true);
      expect(isVATExemptInEthiopia('medicine')).toBe(true);
      expect(isVATExemptInEthiopia('books')).toBe(true);
      expect(isVATExemptInEthiopia('educational-materials')).toBe(true);
    });

    it('should identify non-exempt categories', () => {
      expect(isVATExemptInEthiopia('electronics')).toBe(false);
      expect(isVATExemptInEthiopia('clothing')).toBe(false);
      expect(isVATExemptInEthiopia('luxury-goods')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isVATExemptInEthiopia('MEDICINE')).toBe(true);
      expect(isVATExemptInEthiopia('Basic-Food')).toBe(true);
    });
  });

  describe('formatTaxRate', () => {
    it('should format tax rate as percentage', () => {
      expect(formatTaxRate(0.15)).toBe('15.00%');
      expect(formatTaxRate(0.05)).toBe('5.00%');
      expect(formatTaxRate(0.1)).toBe('10.00%');
    });

    it('should handle decimal rates', () => {
      expect(formatTaxRate(0.175)).toBe('17.50%');
      expect(formatTaxRate(0.0825)).toBe('8.25%');
    });
  });

  describe('calculateTotalWithTax', () => {
    it('should calculate total with tax breakdown', () => {
      const result = calculateTotalWithTax(100, 10, 100, 0.15);
      expect(result.subtotal).toBe(100);
      expect(result.shipping).toBe(10);
      expect(result.taxableAmount).toBe(100);
      expect(result.taxAmount).toBe(15);
      expect(result.total).toBe(125);
    });

    it('should handle different taxable amounts', () => {
      // Taxable amount different from subtotal (e.g., some items exempt)
      const result = calculateTotalWithTax(150, 10, 100, 0.15);
      expect(result.subtotal).toBe(150);
      expect(result.taxableAmount).toBe(100);
      expect(result.taxAmount).toBe(15);
      expect(result.total).toBe(175);
    });

    it('should handle zero shipping', () => {
      const result = calculateTotalWithTax(100, 0, 100, 0.15);
      expect(result.total).toBe(115);
    });

    it('should handle zero tax rate', () => {
      const result = calculateTotalWithTax(100, 10, 100, 0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(110);
    });
  });
});
