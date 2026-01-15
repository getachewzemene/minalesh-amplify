import { type Locale } from './config';

/**
 * Ethiopian Birr currency code
 */
const CURRENCY_CODE = 'ETB';

/**
 * Format a number as Ethiopian Birr currency
 * 
 * @param amount - The amount to format
 * @param locale - The locale for formatting (affects number separators)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale: Locale = 'en'): string {
  // Map our locale codes to standard BCP 47 locale codes
  const localeMap: Record<Locale, string> = {
    en: 'en-ET',
    am: 'am-ET',
    om: 'om-ET',
    ti: 'ti-ET',
  };
  
  const bcp47Locale = localeMap[locale];
  
  try {
    return new Intl.NumberFormat(bcp47Locale, {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported locales
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Format a number with locale-appropriate separators
 */
export function formatNumber(value: number, locale: Locale = 'en'): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-ET',
    am: 'am-ET',
    om: 'om-ET',
    ti: 'ti-ET',
  };
  
  try {
    return new Intl.NumberFormat(localeMap[locale]).format(value);
  } catch {
    return new Intl.NumberFormat('en-US').format(value);
  }
}

/**
 * Format a date with locale-appropriate formatting
 * 
 * @param date - Date to format
 * @param locale - The locale for formatting
 * @param options - Additional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale = 'en',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const localeMap: Record<Locale, string> = {
    en: 'en-ET',
    am: 'am-ET',
    om: 'om-ET',
    ti: 'ti-ET',
  };
  
  try {
    return new Intl.DateTimeFormat(localeMap[locale], {
      timeZone: 'Africa/Addis_Ababa',
      ...options,
    }).format(dateObj);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Addis_Ababa',
      ...options,
    }).format(dateObj);
  }
}

/**
 * Format a date and time with locale-appropriate formatting
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale = 'en'
): string {
  return formatDate(date, locale, { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale = 'en'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  const localeMap: Record<Locale, string> = {
    en: 'en-ET',
    am: 'am-ET',
    om: 'om-ET',
    ti: 'ti-ET',
  };
  
  try {
    const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });
    
    if (diffSec < 60) {
      return rtf.format(-diffSec, 'second');
    } else if (diffMin < 60) {
      return rtf.format(-diffMin, 'minute');
    } else if (diffHour < 24) {
      return rtf.format(-diffHour, 'hour');
    } else if (diffDay < 30) {
      return rtf.format(-diffDay, 'day');
    } else {
      return formatDate(date, locale);
    }
  } catch {
    // Fallback for unsupported locales
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 30) return `${diffDay} days ago`;
    return formatDate(date, locale);
  }
}
