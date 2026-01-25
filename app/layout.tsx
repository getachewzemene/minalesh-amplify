import type { Metadata, Viewport } from 'next'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/context/auth-context"
import { LanguageProvider } from "@/context/language-context"
import { ShopProvider } from "@/context/shop-context"
import { ComparisonProvider } from "@/context/comparison-context"
import { AIHelper } from "@/components/ai-helper"
import { GoogleAnalytics, GoogleTagManager, FacebookPixel } from "@/components/analytics"
import { ComparisonBar } from "@/components/comparison/ComparisonBar"
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav"
import { OrganizationSchema, WebSiteSchema } from "@/components/seo"
import { createBaseMetadata, BASE_URL, ORGANIZATION_INFO } from "@/lib/seo"
import '@/index.css'
import Providers from './providers'

export const metadata: Metadata = {
  ...createBaseMetadata(),
  manifest: '/manifest.json',
}

// Mobile-first viewport configuration for Ethiopian users
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFD700' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Organization and WebSite Structured Data */}
        <OrganizationSchema
          name={ORGANIZATION_INFO.name}
          url={ORGANIZATION_INFO.url}
          logo={ORGANIZATION_INFO.logo}
          description={ORGANIZATION_INFO.description}
          contactPoint={ORGANIZATION_INFO.contactPoint}
        />
        <WebSiteSchema
          name={ORGANIZATION_INFO.name}
          url={ORGANIZATION_INFO.url}
          description={ORGANIZATION_INFO.description}
          searchUrl={`${BASE_URL}/products?q={search_term_string}`}
        />
        <Providers>
          <TooltipProvider>
            <LanguageProvider>
              <AuthProvider>
                <ShopProvider>
                  <ComparisonProvider>
                    {children}
                    <ComparisonBar />
                    <MobileBottomNav />
                    <AIHelper />
                    <GoogleAnalytics />
                    <GoogleTagManager />
                    <FacebookPixel />
                    <Toaster />
                    <Sonner />
                  </ComparisonProvider>
                </ShopProvider>
              </AuthProvider>
            </LanguageProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
