'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { languageNames, locales, type Locale } from "@/i18n/config"

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (langCode: Locale) => {
    setLanguage(langCode)
  }

  const currentLanguage = languageNames[language]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        {locales.map((locale) => {
          const langInfo = languageNames[locale]
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className={`cursor-pointer hover:bg-accent ${language === locale ? 'bg-accent' : ''}`}
            >
              <span className="mr-2">{langInfo.flag}</span>
              <span className="font-medium">{langInfo.nativeName}</span>
              <span className="ml-2 text-muted-foreground">({langInfo.name})</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}