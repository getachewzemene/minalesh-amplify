import prisma from './prisma';
import { ContractStatus, ContractType } from '@prisma/client';

/**
 * Generate a unique contract number
 * Format: CT-YYYYMMDD-XXXX
 */
export async function generateContractNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the last contract number for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const lastContract = await prisma.vendorContract.findFirst({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  let sequence = 1;
  if (lastContract && lastContract.contractNumber) {
    const lastSequence = parseInt(lastContract.contractNumber.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `CT-${dateStr}-${sequenceStr}`;
}

/**
 * Replace variables in contract template content
 */
export function replaceContractVariables(
  content: string,
  variables: Record<string, string | number | Date>
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = value instanceof Date 
      ? value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : String(value);
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return result;
}

/**
 * Check if a contract is due for renewal
 */
export function isContractDueForRenewal(
  contract: {
    endDate: Date;
    autoRenew: boolean;
    status: ContractStatus;
  },
  daysBeforeExpiry: number = 30
): boolean {
  if (!contract.autoRenew || contract.status !== 'active') {
    return false;
  }
  
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysUntilExpiry <= daysBeforeExpiry && daysUntilExpiry > 0;
}

/**
 * Calculate new end date for contract renewal
 */
export function calculateRenewalEndDate(
  currentEndDate: Date,
  renewalPeriodMonths: number
): Date {
  const newEndDate = new Date(currentEndDate);
  newEndDate.setMonth(newEndDate.getMonth() + renewalPeriodMonths);
  return newEndDate;
}

/**
 * Check if a contract is expired
 */
export function isContractExpired(endDate: Date): boolean {
  return new Date() > endDate;
}

/**
 * Get contract type for a vendor profile
 */
export async function suggestContractType(vendorId: string): Promise<ContractType> {
  // Get vendor's sales and performance metrics
  const vendor = await prisma.profile.findUnique({
    where: { id: vendorId },
    include: {
      products: {
        select: {
          saleCount: true,
        },
      },
    },
  });
  
  if (!vendor) {
    return 'standard';
  }
  
  // Calculate total sales
  const totalSales = vendor.products.reduce((sum, product) => sum + product.saleCount, 0);
  
  // Determine contract type based on sales volume
  if (totalSales > 1000) {
    return 'enterprise';
  } else if (totalSales > 100) {
    return 'premium';
  } else {
    return 'standard';
  }
}

/**
 * Validate contract dates
 */
export function validateContractDates(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  if (start < today) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }
  
  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  return { valid: true };
}
