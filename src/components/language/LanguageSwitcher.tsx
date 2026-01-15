'use client'

import * as React from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language-context'
import { languageNames, locales, type Locale } from '@/i18n/config'

/**
 * Language Switcher Component
 * 
 * Provides a dropdown menu for switching between supported languages.
 * Uses the centralized language context for state management.
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const switchLanguage = (newLocale: Locale) => {
    setLanguage(newLocale)
  }

  const currentLanguage = languageNames[language]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Switch language">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.nativeName}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => {
          const langInfo = languageNames[locale]
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => switchLanguage(locale)}
              className={language === locale ? 'bg-accent' : ''}
            >
              <span className="mr-2">{langInfo.flag}</span>
              {langInfo.nativeName}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
