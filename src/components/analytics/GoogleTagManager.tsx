'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

interface GoogleTagManagerProps {
  gtmId?: string;
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const containerId = gtmId || GTM_ID;

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

  // Don't render if no GTM ID or no consent
  if (!containerId || !hasConsent) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${containerId}');
          `,
        }}
      />
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

// Extend the Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Push events to GTM dataLayer
export function pushToDataLayer(event: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
}

// Track page view
export function trackGTMPageView(url: string, title?: string) {
  pushToDataLayer({
    event: 'page_view',
    page_path: url,
    page_title: title || document.title,
  });
}

// Track custom event
export function trackGTMEvent(eventName: string, eventData?: Record<string, unknown>) {
  pushToDataLayer({
    event: eventName,
    ...eventData,
  });
}

// Track user properties
export function setGTMUserProperties(properties: Record<string, unknown>) {
  pushToDataLayer({
    event: 'set_user_properties',
    user_properties: properties,
  });
}

export default GoogleTagManager;
