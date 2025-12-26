'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ti', name: 'ትግርኛ', flag: '🇪🇹' },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = React.useState('en')

  React.useEffect(() => {
    // Get current locale from pathname or cookie
    const pathSegments = pathname.split('/')
    const localeInPath = languages.find(lang => lang.code === pathSegments[1])
    
    if (localeInPath) {
      setCurrentLocale(localeInPath.code)
    } else {
      // Check cookie or default to 'en'
      const savedLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] || 'en'
      setCurrentLocale(savedLocale)
    }
  }, [pathname])

  const switchLanguage = (newLocale: string) => {
    // Save preference to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    
    // Save to user profile if logged in
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLocale }),
    }).catch((error) => {
      // Log error but don't block language change
      console.error('Failed to save language preference:', error)
    })

    // Navigate to new locale
    const pathSegments = pathname.split('/')
    const currentLocaleInPath = languages.find(lang => lang.code === pathSegments[1])
    
    let newPath
    if (currentLocaleInPath) {
      // Replace existing locale in path
      pathSegments[1] = newLocale
      newPath = pathSegments.join('/')
    } else if (newLocale !== 'en') {
      // Add locale to path (only if not English - default)
      newPath = `/${newLocale}${pathname}`
    } else {
      newPath = pathname
    }

    router.push(newPath)
    router.refresh()
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={currentLocale === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
