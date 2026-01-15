/**
 * Root i18n configuration file
 * 
 * This file re-exports the i18n request configuration for next-intl.
 * The actual configuration is in src/i18n/request.ts
 */

// Re-export configuration for convenience
export { locales, defaultLocale, type Locale } from './src/i18n/config';

// Export the request config as default
export { default } from './src/i18n/request';
