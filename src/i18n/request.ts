import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

/**
 * Server-side i18n configuration for next-intl
 * 
 * This function is called on every request to load the appropriate messages
 * based on the current locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request, or use default
  let locale = await requestLocale;
  
  // Validate that the incoming locale is supported
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Configure date/time formatting for Ethiopian context
    timeZone: 'Africa/Addis_Ababa',
    now: new Date(),
    // Formatting options
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        medium: {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'ETB'
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      }
    }
  };
});
