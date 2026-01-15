/**
 * i18n Configuration
 * 
 * Defines supported locales and default locale for the application.
 * Used by both routing and message loading.
 */

export const locales = ['en', 'am', 'om', 'ti'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Language metadata for UI display
 */
export const languageNames: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  am: { name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  om: { name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
  ti: { name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇹' },
};

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
