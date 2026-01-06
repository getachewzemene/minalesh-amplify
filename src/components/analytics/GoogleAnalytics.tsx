'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// Define dataLayer as a global type
declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>
    gtag: (...args: unknown[]) => void
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string
}

// Inner component that uses searchParams
function GoogleAnalyticsInner({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!measurementId) return
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Send pageview on route change
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', measurementId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, measurementId])

  if (!measurementId) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

// Validate Google Analytics measurement ID format
function isValidGAId(id: string): boolean {
  // GA4 format: G-XXXXXXXXXX or UA-XXXXXXXX-X
  const ga4Pattern = /^G-[A-Z0-9]{10,12}$/
  const uaPattern = /^UA-\d{4,10}-\d{1,4}$/
  return ga4Pattern.test(id) || uaPattern.test(id)
}

// Main component with Suspense boundary
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Validate ID format for security
  if (!gaId || !isValidGAId(gaId)) return null

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner measurementId={gaId} />
    </Suspense>
  )
}

// Event tracking helper functions
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

// E-commerce specific events
export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number = 1,
  currency: string = 'ETB'
) => {
  trackEvent('add_to_cart', {
    currency,
    value: price * quantity,
    items: [{
      item_id: productId,
      item_name: productName,
      price,
      quantity,
    }],
  })
}

export const trackRemoveFromCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number = 1,
  currency: string = 'ETB'
) => {
  trackEvent('remove_from_cart', {
    currency,
    value: price * quantity,
    items: [{
      item_id: productId,
      item_name: productName,
      price,
      quantity,
    }],
  })
}

export const trackViewItem = (
  productId: string,
  productName: string,
  price: number,
  category?: string,
  currency: string = 'ETB'
) => {
  trackEvent('view_item', {
    currency,
    value: price,
    items: [{
      item_id: productId,
      item_name: productName,
      item_category: category,
      price,
    }],
  })
}

export const trackViewItemList = (
  items: Array<{
    id: string
    name: string
    price: number
    category?: string
  }>,
  listName: string,
  currency: string = 'ETB'
) => {
  trackEvent('view_item_list', {
    item_list_name: listName,
    items: items.map((item, index) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      index,
    })),
  })
}

export const trackBeginCheckout = (
  cartItems: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>,
  totalValue: number,
  currency: string = 'ETB'
) => {
  trackEvent('begin_checkout', {
    currency,
    value: totalValue,
    items: cartItems.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}

export const trackPurchase = (
  transactionId: string,
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>,
  totalValue: number,
  tax: number = 0,
  shipping: number = 0,
  currency: string = 'ETB'
) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value: totalValue,
    tax,
    shipping,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  })
}

export const trackSearch = (searchTerm: string) => {
  trackEvent('search', {
    search_term: searchTerm,
  })
}

export const trackLogin = (method: string = 'email') => {
  trackEvent('login', {
    method,
  })
}

export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', {
    method,
  })
}

export const trackShare = (
  contentType: string,
  itemId: string,
  method: string
) => {
  trackEvent('share', {
    content_type: contentType,
    item_id: itemId,
    method,
  })
}

export const trackAddToWishlist = (
  productId: string,
  productName: string,
  price: number,
  currency: string = 'ETB'
) => {
  trackEvent('add_to_wishlist', {
    currency,
    value: price,
    items: [{
      item_id: productId,
      item_name: productName,
      price,
    }],
  })
}
