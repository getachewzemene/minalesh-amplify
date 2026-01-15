'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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
  // Initialize language from localStorage or cookie
  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
      if (saved && locales.includes(saved)) return saved;
      
      // Check cookie
      const cookieMatch = document.cookie.match(new RegExp(`${LANGUAGE_COOKIE}=([^;]+)`));
      if (cookieMatch) {
        const cookieLocale = cookieMatch[1] as Locale;
        if (locales.includes(cookieLocale)) return cookieLocale;
      }
    }
    return defaultLocale;
  });

  // Sync with localStorage on mount (handle SSR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
      if (saved && locales.includes(saved) && saved !== language) {
        setLanguageState(saved);
      }
    }
  }, []);

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
    }
  }, []);

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
