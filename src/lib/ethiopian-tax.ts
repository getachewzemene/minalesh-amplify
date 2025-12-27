/**
 * Ethiopian Tax Compliance Utilities
 * Utilities for Ethiopian tax compliance including TIN validation,
 * tax invoice generation, and withholding tax calculations
 */

/**
 * Validate Ethiopian TIN (Tax Identification Number)
 * Ethiopian TIN format: 10 digits (e.g., 0123456789)
 */
export function validateEthiopianTIN(tin: string): {
  isValid: boolean;
  error?: string;
} {
  if (!tin) {
    return { isValid: false, error: 'TIN is required' };
  }

  // Remove any spaces or dashes
  const cleanTIN = tin.replace(/[\s-]/g, '');

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanTIN)) {
    return {
      isValid: false,
      error: 'TIN must be exactly 10 digits',
    };
  }

  // Additional validation: check for all zeros or all same digits
  if (/^0{10}$/.test(cleanTIN) || /^(\d)\1{9}$/.test(cleanTIN)) {
    return {
      isValid: false,
      error: 'TIN cannot be all zeros or all same digits',
    };
  }

  return { isValid: true };
}

/**
 * Format Ethiopian TIN for display
 * Format: XXXX-XXX-XXX
 */
export function formatEthiopianTIN(tin: string): string {
  const cleanTIN = tin.replace(/[\s-]/g, '');
  if (cleanTIN.length !== 10) {
    return tin;
  }
  return `${cleanTIN.slice(0, 4)}-${cleanTIN.slice(4, 7)}-${cleanTIN.slice(7)}`;
}

/**
 * Calculate Ethiopian withholding tax
 * Standard withholding tax is 2% for services and 3% for goods
 */
export function calculateWithholdingTax(
  amount: number,
  type: 'goods' | 'services' = 'services'
): {
  withholdingTaxRate: number;
  withholdingTaxAmount: number;
  netAmount: number;
} {
  const withholdingTaxRate = type === 'services' ? 0.02 : 0.03;
  const withholdingTaxAmount = amount * withholdingTaxRate;
  const netAmount = amount - withholdingTaxAmount;

  return {
    withholdingTaxRate,
    withholdingTaxAmount,
    netAmount,
  };
}

/**
 * Generate Ethiopian Tax Invoice Number
 * Format: ET-YYYYMMDD-NNNNNN (e.g., ET-20241226-000001)
 */
export function generateTaxInvoiceNumber(sequenceNumber: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(sequenceNumber).padStart(6, '0');

  return `ET-${year}${month}${day}-${sequence}`;
}

/**
 * Calculate tax breakdown for Ethiopian tax invoice
 */
export interface EthiopianTaxInvoiceBreakdown {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  totalBeforeTax: number;
  totalAfterTax: number;
  netAmount: number;
}

export function calculateEthiopianTaxInvoiceBreakdown(
  subtotal: number,
  options: {
    includeVAT?: boolean;
    vatRate?: number;
    includeWithholdingTax?: boolean;
    withholdingTaxType?: 'goods' | 'services';
  } = {}
): EthiopianTaxInvoiceBreakdown {
  const {
    includeVAT = true,
    vatRate = 0.15, // 15% standard VAT in Ethiopia
    includeWithholdingTax = false,
    withholdingTaxType = 'services',
  } = options;

  let vatAmount = 0;
  if (includeVAT) {
    vatAmount = subtotal * vatRate;
  }

  const totalAfterTax = subtotal + vatAmount;

  let withholdingTaxAmount = 0;
  let withholdingTaxRate = 0;
  let netAmount = totalAfterTax;

  if (includeWithholdingTax) {
    const withholdingResult = calculateWithholdingTax(
      totalAfterTax,
      withholdingTaxType
    );
    withholdingTaxRate = withholdingResult.withholdingTaxRate;
    withholdingTaxAmount = withholdingResult.withholdingTaxAmount;
    netAmount = withholdingResult.netAmount;
  }

  return {
    subtotal,
    vatRate,
    vatAmount,
    withholdingTaxRate: includeWithholdingTax ? withholdingTaxRate : undefined,
    withholdingTaxAmount: includeWithholdingTax ? withholdingTaxAmount : undefined,
    totalBeforeTax: subtotal,
    totalAfterTax,
    netAmount,
  };
}

/**
 * Check if a product category is VAT exempt in Ethiopia
 * Extended list of exempt categories
 */
export function isVATExemptInEthiopia(productCategory: string): boolean {
  const exemptCategories = [
    'basic-food',
    'agriculture',
    'agricultural-inputs',
    'medicine',
    'medical-supplies',
    'medical-equipment',
    'books',
    'educational-materials',
    'school-supplies',
    'financial-services',
    'insurance',
    'fertilizer',
    'seeds',
    'livestock',
    'veterinary-services',
  ];

  return exemptCategories.includes(productCategory.toLowerCase());
}

/**
 * Tax compliance reporting utilities
 */

export interface TaxReportPeriod {
  startDate: Date;
  endDate: Date;
  periodType: 'monthly' | 'quarterly' | 'annual';
}

export interface TaxReportSummary {
  period: TaxReportPeriod;
  totalSales: number;
  taxableAmount: number;
  vatCollected: number;
  withholdingTaxDeducted: number;
  netTaxLiability: number;
}

/**
 * Calculate tax report summary for a given period
 */
export function calculateTaxReportSummary(
  sales: Array<{
    amount: number;
    isVATExempt: boolean;
    vatAmount: number;
    withholdingTaxAmount?: number;
  }>,
  period: TaxReportPeriod
): TaxReportSummary {
  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const taxableAmount = sales
    .filter((sale) => !sale.isVATExempt)
    .reduce((sum, sale) => sum + sale.amount, 0);
  const vatCollected = sales.reduce((sum, sale) => sum + sale.vatAmount, 0);
  const withholdingTaxDeducted = sales.reduce(
    (sum, sale) => sum + (sale.withholdingTaxAmount || 0),
    0
  );
  const netTaxLiability = vatCollected - withholdingTaxDeducted;

  return {
    period,
    totalSales,
    taxableAmount,
    vatCollected,
    withholdingTaxDeducted,
    netTaxLiability,
  };
}

/**
 * Validate Ethiopian Business License Number
 * Format varies by region, but typically alphanumeric
 */
export function validateEthiopianBusinessLicense(license: string): {
  isValid: boolean;
  error?: string;
} {
  if (!license) {
    return { isValid: false, error: 'Business license is required' };
  }

  const cleanLicense = license.trim();

  // Check minimum length
  if (cleanLicense.length < 5) {
    return {
      isValid: false,
      error: 'Business license must be at least 5 characters',
    };
  }

  // Check for alphanumeric characters and common separators
  if (!/^[A-Z0-9\s\-/]+$/i.test(cleanLicense)) {
    return {
      isValid: false,
      error: 'Business license contains invalid characters',
    };
  }

  return { isValid: true };
}
