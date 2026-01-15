'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter as useNextRouter, usePathname as useNextPathname } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

interface Translations {
  en: string;
  am: string;
  om: string;
  ti: string;
}

interface LanguageContextValue {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (translations: Translations) => string;
}

const LANGUAGE_COOKIE = 'preferred_language';
const LANGUAGE_STORAGE_KEY = 'language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Detects the current locale from the URL path
 */
function getLocaleFromPath(pathname: string): Locale {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

/**
 * Sets a cookie with the language preference
 */
function setLanguageCookie(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `${LANGUAGE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
  }
}

/**
 * Saves language preference to the server for authenticated users
 */
async function saveLanguagePreferenceToServer(locale: Locale): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: locale }),
      });
    }
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const nextRouter = useNextRouter();
  const pathname = useNextPathname();
  
  // Initialize language from URL or localStorage
  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      // First check URL
      const urlLocale = getLocaleFromPath(window.location.pathname);
      if (urlLocale !== defaultLocale) return urlLocale;
      
      // Then check localStorage
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
      if (saved && locales.includes(saved)) return saved;
    }
    return defaultLocale;
  });

  // Sync language state with URL on client-side navigation
  useEffect(() => {
    const urlLocale = getLocaleFromPath(pathname);
    if (urlLocale !== language) {
      setLanguageState(urlLocale);
    }
  }, [pathname, language]);

  const setLanguage = useCallback((lang: Locale) => {
    if (!locales.includes(lang)) return;
    
    setLanguageState(lang);
    
    if (typeof window !== 'undefined') {
      // Save to localStorage
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      
      // Save to cookie for middleware detection
      setLanguageCookie(lang);
      
      // Save to server for authenticated users
      saveLanguagePreferenceToServer(lang);
      
      // Navigate to the new locale URL
      const currentPath = pathname;
      let newPath: string;
      
      // Remove existing locale prefix if present
      let pathWithoutLocale = currentPath;
      for (const locale of locales) {
        if (currentPath.startsWith(`/${locale}/`)) {
          pathWithoutLocale = currentPath.substring(locale.length + 1);
          break;
        } else if (currentPath === `/${locale}`) {
          pathWithoutLocale = '/';
          break;
        }
      }
      
      // Add new locale prefix (don't add for default locale with 'as-needed' strategy)
      if (lang === defaultLocale) {
        newPath = pathWithoutLocale;
      } else {
        newPath = `/${lang}${pathWithoutLocale}`;
      }
      
      nextRouter.push(newPath);
    }
  }, [pathname, nextRouter]);

  const t = useCallback((translations: Translations) => {
    return translations[language] || translations[defaultLocale];
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// Re-export Locale type for backwards compatibility
export type { Locale } from "@/i18n/config";
// Alias for backwards compatibility with existing code that uses Language type
export type Language = Locale;
