import { describe, it, expect } from 'vitest';
import {
  validateEthiopianTIN,
  formatEthiopianTIN,
  calculateWithholdingTax,
  generateTaxInvoiceNumber,
  calculateEthiopianTaxInvoiceBreakdown,
  isVATExemptInEthiopia,
  calculateTaxReportSummary,
  validateEthiopianBusinessLicense,
} from './ethiopian-tax';

describe('Ethiopian Tax Utilities', () => {
  describe('validateEthiopianTIN', () => {
    it('should validate correct TIN format', () => {
      const result = validateEthiopianTIN('0123456789');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept TIN with spaces or dashes', () => {
      const result = validateEthiopianTIN('0123-456-789');
      expect(result.isValid).toBe(true);
    });

    it('should reject TIN with less than 10 digits', () => {
      const result = validateEthiopianTIN('123456789');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10 digits');
    });

    it('should reject TIN with more than 10 digits', () => {
      const result = validateEthiopianTIN('12345678901');
      expect(result.isValid).toBe(false);
    });

    it('should reject TIN with all zeros', () => {
      const result = validateEthiopianTIN('0000000000');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('all zeros');
    });

    it('should reject TIN with all same digits', () => {
      const result = validateEthiopianTIN('1111111111');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('all same digits');
    });

    it('should reject empty TIN', () => {
      const result = validateEthiopianTIN('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject TIN with letters', () => {
      const result = validateEthiopianTIN('012345678A');
      expect(result.isValid).toBe(false);
    });
  });

  describe('formatEthiopianTIN', () => {
    it('should format TIN correctly', () => {
      const formatted = formatEthiopianTIN('0123456789');
      expect(formatted).toBe('0123-456-789');
    });

    it('should handle already formatted TIN', () => {
      const formatted = formatEthiopianTIN('0123-456-789');
      expect(formatted).toBe('0123-456-789');
    });

    it('should return original if not 10 digits', () => {
      const formatted = formatEthiopianTIN('123');
      expect(formatted).toBe('123');
    });
  });

  describe('calculateWithholdingTax', () => {
    it('should calculate 2% withholding tax for services', () => {
      const result = calculateWithholdingTax(1000, 'services');
      expect(result.withholdingTaxRate).toBe(0.02);
      expect(result.withholdingTaxAmount).toBe(20);
      expect(result.netAmount).toBe(980);
    });

    it('should calculate 3% withholding tax for goods', () => {
      const result = calculateWithholdingTax(1000, 'goods');
      expect(result.withholdingTaxRate).toBe(0.03);
      expect(result.withholdingTaxAmount).toBe(30);
      expect(result.netAmount).toBe(970);
    });

    it('should default to services if type not specified', () => {
      const result = calculateWithholdingTax(1000);
      expect(result.withholdingTaxRate).toBe(0.02);
    });

    it('should handle decimal amounts', () => {
      const result = calculateWithholdingTax(1500.50, 'services');
      expect(result.withholdingTaxAmount).toBeCloseTo(30.01, 2);
      expect(result.netAmount).toBeCloseTo(1470.49, 2);
    });
  });

  describe('generateTaxInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
      const invoiceNumber = generateTaxInvoiceNumber(1);
      expect(invoiceNumber).toMatch(/^ET-\d{8}-\d{6}$/);
    });

    it('should pad sequence number with zeros', () => {
      const invoiceNumber = generateTaxInvoiceNumber(42);
      expect(invoiceNumber).toContain('-000042');
    });

    it('should handle large sequence numbers', () => {
      const invoiceNumber = generateTaxInvoiceNumber(123456);
      expect(invoiceNumber).toContain('-123456');
    });
  });

  describe('calculateEthiopianTaxInvoiceBreakdown', () => {
    it('should calculate invoice breakdown with VAT', () => {
      const result = calculateEthiopianTaxInvoiceBreakdown(1000);
      expect(result.subtotal).toBe(1000);
      expect(result.vatRate).toBe(0.15);
      expect(result.vatAmount).toBe(150);
      expect(result.totalAfterTax).toBe(1150);
      expect(result.netAmount).toBe(1150);
    });

    it('should calculate invoice without VAT when disabled', () => {
      const result = calculateEthiopianTaxInvoiceBreakdown(1000, {
        includeVAT: false,
      });
      expect(result.vatAmount).toBe(0);
      expect(result.totalAfterTax).toBe(1000);
    });

    it('should calculate with custom VAT rate', () => {
      const result = calculateEthiopianTaxInvoiceBreakdown(1000, {
        vatRate: 0.10,
      });
      expect(result.vatAmount).toBe(100);
      expect(result.totalAfterTax).toBe(1100);
    });

    it('should calculate with withholding tax for services', () => {
      const result = calculateEthiopianTaxInvoiceBreakdown(1000, {
        includeWithholdingTax: true,
        withholdingTaxType: 'services',
      });
      expect(result.totalAfterTax).toBe(1150); // 1000 + 150 VAT
      expect(result.withholdingTaxAmount).toBe(23); // 2% of 1150
      expect(result.netAmount).toBe(1127); // 1150 - 23
    });

    it('should calculate with withholding tax for goods', () => {
      const result = calculateEthiopianTaxInvoiceBreakdown(1000, {
        includeWithholdingTax: true,
        withholdingTaxType: 'goods',
      });
      expect(result.totalAfterTax).toBe(1150);
      expect(result.withholdingTaxAmount).toBe(34.5); // 3% of 1150
      expect(result.netAmount).toBe(1115.5);
    });
  });

  describe('isVATExemptInEthiopia', () => {
    it('should identify exempt categories', () => {
      expect(isVATExemptInEthiopia('basic-food')).toBe(true);
      expect(isVATExemptInEthiopia('medicine')).toBe(true);
      expect(isVATExemptInEthiopia('books')).toBe(true);
      expect(isVATExemptInEthiopia('educational-materials')).toBe(true);
      expect(isVATExemptInEthiopia('agricultural-inputs')).toBe(true);
      expect(isVATExemptInEthiopia('fertilizer')).toBe(true);
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

  describe('calculateTaxReportSummary', () => {
    it('should calculate tax report summary correctly', () => {
      const sales = [
        { amount: 1000, isVATExempt: false, vatAmount: 150, withholdingTaxAmount: 20 },
        { amount: 500, isVATExempt: true, vatAmount: 0, withholdingTaxAmount: 0 },
        { amount: 800, isVATExempt: false, vatAmount: 120, withholdingTaxAmount: 15 },
      ];

      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        periodType: 'monthly' as const,
      };

      const result = calculateTaxReportSummary(sales, period);

      expect(result.totalSales).toBe(2300);
      expect(result.taxableAmount).toBe(1800); // 1000 + 800
      expect(result.vatCollected).toBe(270); // 150 + 120
      expect(result.withholdingTaxDeducted).toBe(35); // 20 + 15
      expect(result.netTaxLiability).toBe(235); // 270 - 35
      expect(result.period).toEqual(period);
    });

    it('should handle empty sales', () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        periodType: 'monthly' as const,
      };

      const result = calculateTaxReportSummary([], period);

      expect(result.totalSales).toBe(0);
      expect(result.taxableAmount).toBe(0);
      expect(result.vatCollected).toBe(0);
      expect(result.withholdingTaxDeducted).toBe(0);
      expect(result.netTaxLiability).toBe(0);
    });
  });

  describe('validateEthiopianBusinessLicense', () => {
    it('should validate correct business license', () => {
      const result = validateEthiopianBusinessLicense('AB123456');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept various formats', () => {
      expect(validateEthiopianBusinessLicense('AA/BB/12345').isValid).toBe(true);
      expect(validateEthiopianBusinessLicense('12345-ABC').isValid).toBe(true);
      expect(validateEthiopianBusinessLicense('AB 12 CD 34').isValid).toBe(true);
    });

    it('should reject empty license', () => {
      const result = validateEthiopianBusinessLicense('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject license with less than 5 characters', () => {
      const result = validateEthiopianBusinessLicense('AB12');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 5 characters');
    });

    it('should reject license with invalid characters', () => {
      const result = validateEthiopianBusinessLicense('AB@123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });
});
