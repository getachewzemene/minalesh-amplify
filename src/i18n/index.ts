/**
 * i18n Module
 * 
 * This module provides internationalization support for the Minalesh marketplace.
 * Supports English, Amharic, Oromo, and Tigrinya languages.
 */

// Configuration exports
export { 
  locales, 
  defaultLocale, 
  languageNames, 
  isValidLocale,
  type Locale 
} from './config';

// Navigation exports (use these instead of next/navigation)
export { 
  Link, 
  redirect, 
  usePathname, 
  useRouter, 
  getPathname,
  routing 
} from './navigation';

// Formatting exports
export {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from './formatting';
