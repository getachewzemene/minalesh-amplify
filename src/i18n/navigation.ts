import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

/**
 * Routing configuration for next-intl
 * 
 * Defines how locales are handled in URL paths.
 * Using 'as-needed' strategy means:
 * - Default locale (en) doesn't show in URL: /products
 * - Other locales show in URL: /am/products, /om/products, /ti/products
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Use 'as-needed' to hide default locale from URL
  localePrefix: 'as-needed',
});

/**
 * Navigation utilities that are aware of the current locale
 * Use these instead of next/navigation equivalents
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
