'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

interface FacebookPixelProps {
  pixelId?: string;
}

// Extend the Window interface to include fbq
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const fbPixelId = pixelId || FB_PIXEL_ID;

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

  // Don't render if no Pixel ID or no consent
  if (!fbPixelId || !hasConsent) {
    return null;
  }

  return (
    <Script
      id="facebook-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${fbPixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

// Track Facebook Pixel events

// Standard events
export function trackFBPageView() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
}

export function trackFBViewContent(params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      currency: params?.currency || 'ETB',
      ...params,
    });
  }
}

export function trackFBSearch(params?: {
  search_string?: string;
  content_category?: string;
  content_ids?: string[];
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Search', params);
  }
}

export function trackFBAddToCart(params: {
  content_ids: string[];
  content_name: string;
  content_type?: string;
  value: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type || 'product',
      value: params.value,
      currency: params.currency || 'ETB',
    });
  }
}

export function trackFBAddToWishlist(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToWishlist', {
      content_ids: params.content_ids,
      content_name: params.content_name,
      value: params.value,
      currency: params.currency || 'ETB',
    });
  }
}

export function trackFBInitiateCheckout(params: {
  content_ids: string[];
  num_items: number;
  value: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: params.content_ids,
      num_items: params.num_items,
      value: params.value,
      currency: params.currency || 'ETB',
    });
  }
}

export function trackFBAddPaymentInfo(params?: {
  content_ids?: string[];
  value?: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', {
      currency: params?.currency || 'ETB',
      ...params,
    });
  }
}

export function trackFBPurchase(params: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items?: number;
  content_type?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: params.content_ids,
      content_type: params.content_type || 'product',
      value: params.value,
      currency: params.currency || 'ETB',
      num_items: params.num_items,
    });
  }
}

export function trackFBLead(params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      currency: params?.currency || 'ETB',
      ...params,
    });
  }
}

export function trackFBCompleteRegistration(params?: {
  content_name?: string;
  status?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      currency: params?.currency || 'ETB',
      ...params,
    });
  }
}

// Custom events
export function trackFBCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

export default FacebookPixel;
