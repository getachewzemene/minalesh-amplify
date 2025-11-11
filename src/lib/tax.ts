import prisma from './prisma';

export interface TaxAddress {
  country: string;
  region?: string;
  city?: string;
}

export interface TaxCalculation {
  taxRateId: string;
  name: string;
  rate: number;
  taxType: string;
  amount: number;
  isCompound: boolean;
}

export interface TaxCalculationResult {
  taxes: TaxCalculation[];
  totalTaxAmount: number;
  subtotalWithTax: number;
}

/**
 * Get applicable tax rates for an address
 */
export async function getApplicableTaxRates(
  address: TaxAddress
): Promise<
  Array<{
    id: string;
    name: string;
    rate: number;
    taxType: string;
    isCompound: boolean;
    priority: number;
  }>
> {
  const taxRates = await prisma.taxRate.findMany({
    where: {
      isActive: true,
      country: address.country,
      OR: [
        // Exact match for region and city
        {
          region: address.region || null,
          city: address.city || null,
        },
        // Match region only
        {
          region: address.region || null,
          city: null,
        },
        // National rate (no region or city specified)
        {
          region: null,
          city: null,
        },
      ],
    },
    orderBy: {
      priority: 'asc',
    },
  });

  // Filter to most specific rates
  // Priority: city > region > national
  const cityRates = taxRates.filter(
    (r) => r.city === address.city && r.region === address.region
  );
  const regionRates = taxRates.filter(
    (r) => r.region === address.region && !r.city
  );
  const nationalRates = taxRates.filter((r) => !r.region && !r.city);

  const applicableRates =
    cityRates.length > 0
      ? cityRates
      : regionRates.length > 0
      ? regionRates
      : nationalRates;

  return applicableRates.map((rate) => ({
    id: rate.id,
    name: rate.name,
    rate: Number(rate.rate),
    taxType: rate.taxType,
    isCompound: rate.isCompound,
    priority: rate.priority,
  }));
}

/**
 * Calculate taxes for a subtotal
 */
export async function calculateTax(
  subtotal: number,
  address: TaxAddress
): Promise<TaxCalculationResult> {
  const taxRates = await getApplicableTaxRates(address);

  if (taxRates.length === 0) {
    return {
      taxes: [],
      totalTaxAmount: 0,
      subtotalWithTax: subtotal,
    };
  }

  const taxes: TaxCalculation[] = [];
  let runningTotal = subtotal;

  // Apply non-compound taxes first
  for (const taxRate of taxRates.filter((r) => !r.isCompound)) {
    const taxAmount = subtotal * taxRate.rate;
    taxes.push({
      taxRateId: taxRate.id,
      name: taxRate.name,
      rate: taxRate.rate,
      taxType: taxRate.taxType,
      amount: taxAmount,
      isCompound: false,
    });
  }

  // Apply compound taxes on top of subtotal + non-compound taxes
  const nonCompoundTaxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  runningTotal = subtotal + nonCompoundTaxTotal;

  for (const taxRate of taxRates.filter((r) => r.isCompound)) {
    const taxAmount = runningTotal * taxRate.rate;
    taxes.push({
      taxRateId: taxRate.id,
      name: taxRate.name,
      rate: taxRate.rate,
      taxType: taxRate.taxType,
      amount: taxAmount,
      isCompound: true,
    });
    runningTotal += taxAmount;
  }

  const totalTaxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    taxes,
    totalTaxAmount,
    subtotalWithTax: subtotal + totalTaxAmount,
  };
}

/**
 * Calculate Ethiopian VAT
 * Ethiopia uses a standard VAT rate of 15%
 */
export function calculateEthiopianVAT(subtotal: number): TaxCalculationResult {
  const ETHIOPIAN_VAT_RATE = 0.15; // 15%

  const vatAmount = subtotal * ETHIOPIAN_VAT_RATE;

  return {
    taxes: [
      {
        taxRateId: 'ethiopian-vat',
        name: 'Ethiopian VAT',
        rate: ETHIOPIAN_VAT_RATE,
        taxType: 'VAT',
        amount: vatAmount,
        isCompound: false,
      },
    ],
    totalTaxAmount: vatAmount,
    subtotalWithTax: subtotal + vatAmount,
  };
}

/**
 * Check if a product/service is VAT exempt in Ethiopia
 * Common exemptions include basic food items, medicines, books, etc.
 */
export function isVATExemptInEthiopia(productCategory: string): boolean {
  const exemptCategories = [
    'basic-food',
    'medicine',
    'medical-supplies',
    'books',
    'educational-materials',
    'agricultural-inputs',
    'financial-services',
  ];

  return exemptCategories.includes(productCategory.toLowerCase());
}

/**
 * Format tax rate as percentage string
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Calculate total with tax breakdown
 */
export function calculateTotalWithTax(
  subtotal: number,
  shippingAmount: number,
  taxableSubtotal: number,
  taxRate: number
): {
  subtotal: number;
  shipping: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const taxAmount = taxableSubtotal * taxRate;
  const total = subtotal + shippingAmount + taxAmount;

  return {
    subtotal,
    shipping: shippingAmount,
    taxableAmount: taxableSubtotal,
    taxAmount,
    total,
  };
}
