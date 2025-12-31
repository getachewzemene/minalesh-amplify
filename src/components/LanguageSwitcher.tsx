'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ (Amharic)', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromoo (Oromo)', flag: '🇪🇹' },
  { code: 'ti', name: 'ትግርኛ (Tigrinya)', flag: '🇪🇹' },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1] || 'en'
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const switchLanguage = async (locale: string) => {
    // Save to user preferences if logged in
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: locale }),
        })
      } catch (error) {
        console.error('Failed to save language preference:', error)
      }
    }

    // Save to localStorage as fallback
    localStorage.setItem('preferred_language', locale)

    // Navigate to the new locale
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    router.push(`/${locale}${pathWithoutLocale}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.name}</span>
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
