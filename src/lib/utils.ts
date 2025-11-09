import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Ethiopian Birr (ETB) with proper formatting
 * @param amount - The amount to format
 * @returns Formatted string like "ETB 2,499.00"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "ETB 0.00"
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return "ETB 0.00"
  }
  
  // Format with 2 decimal places and thousand separators
  return `ETB ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
