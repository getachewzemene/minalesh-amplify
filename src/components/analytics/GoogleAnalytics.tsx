'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const gaId = measurementId || GA_MEASUREMENT_ID;

  useEffect(() => {
    // Check for cookie consent
    const checkConsent = () => {
      try {
        const preferences = localStorage.getItem('minalesh-cookie-preferences');
        if (preferences) {
          const parsed = JSON.parse(preferences);
          setHasConsent(parsed.analytics === true);
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
      }
    };

    checkConsent();

    // Listen for consent changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'minalesh-cookie-preferences') {
        checkConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Don't render if no GA ID or no consent
  if (!gaId || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

// Helper function to track page views
export function pageview(url: string) {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// E-commerce event tracking types
interface ProductItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price: number;
  quantity?: number;
  currency?: string;
}

interface EcommerceEventParams {
  currency?: string;
  value?: number;
  items?: ProductItem[];
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
  search_term?: string;
}

// Generic event tracking
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// E-commerce: View product
export function trackViewProduct(product: ProductItem) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: product.currency || 'ETB',
      value: product.price,
      items: [product],
    });
  }
}

// E-commerce: Add to cart
export function trackAddToCart(product: ProductItem) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: product.currency || 'ETB',
      value: product.price * (product.quantity || 1),
      items: [product],
    });
  }
}

// E-commerce: Remove from cart
export function trackRemoveFromCart(product: ProductItem) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'remove_from_cart', {
      currency: product.currency || 'ETB',
      value: product.price * (product.quantity || 1),
      items: [product],
    });
  }
}

// E-commerce: View cart
export function trackViewCart(items: ProductItem[], value: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_cart', {
      currency: 'ETB',
      value,
      items,
    });
  }
}

// E-commerce: Begin checkout
export function trackBeginCheckout(params: EcommerceEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: params.currency || 'ETB',
      value: params.value,
      items: params.items,
      coupon: params.coupon,
    });
  }
}

// E-commerce: Add shipping info
export function trackAddShippingInfo(params: EcommerceEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_shipping_info', {
      currency: params.currency || 'ETB',
      value: params.value,
      items: params.items,
      shipping_tier: params.shipping,
    });
  }
}

// E-commerce: Add payment info
export function trackAddPaymentInfo(params: EcommerceEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_payment_info', {
      currency: params.currency || 'ETB',
      value: params.value,
      items: params.items,
    });
  }
}

// E-commerce: Purchase completed
export function trackPurchase(params: EcommerceEventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: params.transaction_id,
      currency: params.currency || 'ETB',
      value: params.value,
      shipping: params.shipping,
      tax: params.tax,
      coupon: params.coupon,
      items: params.items,
    });
  }
}

// E-commerce: Refund
export function trackRefund(transactionId: string, value?: number, items?: ProductItem[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'refund', {
      transaction_id: transactionId,
      currency: 'ETB',
      value,
      items,
    });
  }
}

// Search event
export function trackSearch(searchTerm: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
}

// Sign up event
export function trackSignUp(method: string = 'email') {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method,
    });
  }
}

// Login event
export function trackLogin(method: string = 'email') {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method,
    });
  }
}

// Wishlist event
export function trackAddToWishlist(product: ProductItem) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_wishlist', {
      currency: product.currency || 'ETB',
      value: product.price,
      items: [product],
    });
  }
}

// Share event
export function trackShare(method: string, contentType: string, itemId: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      method,
      content_type: contentType,
      item_id: itemId,
    });
  }
}

// Price alert created
export function trackPriceAlertCreated(productId: string, targetPrice: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'price_alert_created', {
      event_category: 'engagement',
      product_id: productId,
      target_price: targetPrice,
    });
  }
}

// Saved search created
export function trackSavedSearchCreated(searchQuery: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'saved_search_created', {
      event_category: 'engagement',
      search_query: searchQuery,
    });
  }
}

export default GoogleAnalytics;
