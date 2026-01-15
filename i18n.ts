import { getRequestConfig } from 'next-intl/server';

/**
 * Root i18n configuration file for next-intl
 * 
 * This file configures message loading and locale handling.
 * Supported locales: English (en), Amharic (am), Oromo (om), Tigrinya (ti)
 */

export const locales = ['en', 'am', 'om', 'ti'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request, or use default
  let locale = await requestLocale;
  
  // Validate that the incoming locale is supported
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // Configure date/time formatting for Ethiopian context
    timeZone: 'Africa/Addis_Ababa',
    now: new Date(),
  };
});
