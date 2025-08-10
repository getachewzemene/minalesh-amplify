import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

type Language = 'en' | 'am'

interface LanguageOption {
  code: Language
  name: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' }
]

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null
    if (savedLang && languages.find(lang => lang.code === savedLang)) {
      setSelectedLanguage(savedLang)
    }
  }, [])

  const handleLanguageChange = (langCode: Language) => {
    setSelectedLanguage(langCode)
    localStorage.setItem('language', langCode)
    // In a real app, this would trigger i18n changes
  }

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-primary hover:bg-primary/90 border-primary text-primary-foreground"
        >
          <Globe className="h-4 w-4 mr-2" />
          {currentLanguage?.nativeName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="cursor-pointer hover:bg-accent"
          >
            <span className="font-medium">{language.nativeName}</span>
            <span className="ml-2 text-muted-foreground">({language.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}