import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/context/auth-context"
import { LanguageProvider } from "@/context/language-context"
import { ShopProvider } from "@/context/shop-context"
import { ComparisonProvider } from "@/context/comparison-context"
import { AIHelper } from "@/components/ai-helper"
import { GoogleAnalytics } from "@/components/analytics"
import { ComparisonBar } from "@/components/comparison/ComparisonBar"
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import '@/index.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Minalesh - Ethiopia\'s Intelligent Marketplace',
  description: 'Ethiopia\'s intelligent e-commerce marketplace',
  authors: [{ name: 'Minalesh' }],
  openGraph: {
    title: 'Minalesh - Ethiopia\'s Intelligent Marketplace',
    description: 'Ethiopia\'s intelligent e-commerce marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider>
              <LanguageProvider>
                <AuthProvider>
                  <ShopProvider>
                    <ComparisonProvider>
                      {children}
                      <ComparisonBar />
                      <AIHelper />
                      <GoogleAnalytics />
                      <Toaster />
                      <Sonner />
                    </ComparisonProvider>
                  </ShopProvider>
                </AuthProvider>
              </LanguageProvider>
            </TooltipProvider>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  )
}
