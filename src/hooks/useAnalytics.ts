'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '@/components/analytics/GoogleAnalytics';
import { trackGTMPageView } from '@/components/analytics/GoogleTagManager';
import { trackFBPageView } from '@/components/analytics/FacebookPixel';
import {
  ConversionTracker,
  EngagementTracker,
  FunnelTracker,
  type AnalyticsProduct,
} from '@/lib/analytics-tracker';

/**
 * Hook for tracking page views across all analytics platforms
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      // Track in all platforms
      pageview(url);
      trackGTMPageView(url);
      trackFBPageView();
    }
  }, [pathname, searchParams]);
}

/**
 * Hook for tracking conversion funnel
 */
export function useConversionTracking() {
  const trackProductView = useCallback((product: AnalyticsProduct) => {
    ConversionTracker.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback((product: AnalyticsProduct) => {
    ConversionTracker.trackAddToCart(product);
  }, []);

  const trackRemoveFromCart = useCallback((product: AnalyticsProduct) => {
    ConversionTracker.trackRemoveFromCart(product);
  }, []);

  const trackViewCart = useCallback((products: AnalyticsProduct[], totalValue: number) => {
    ConversionTracker.trackViewCart(products, totalValue);
  }, []);

  const trackBeginCheckout = useCallback(
    (products: AnalyticsProduct[], totalValue: number, coupon?: string) => {
      ConversionTracker.trackBeginCheckout(products, totalValue, coupon);
    },
    []
  );

  const trackAddShippingInfo = useCallback(
    (products: AnalyticsProduct[], totalValue: number, shippingTier?: string) => {
      ConversionTracker.trackAddShippingInfo(products, totalValue, shippingTier);
    },
    []
  );

  const trackAddPaymentInfo = useCallback(
    (products: AnalyticsProduct[], totalValue: number, paymentType?: string) => {
      ConversionTracker.trackAddPaymentInfo(products, totalValue, paymentType);
    },
    []
  );

  const trackPurchase = useCallback(
    (params: {
      transactionId: string;
      products: AnalyticsProduct[];
      totalValue: number;
      shipping?: number;
      tax?: number;
      coupon?: string;
    }) => {
      ConversionTracker.trackPurchase(params);
    },
    []
  );

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,
  };
}

/**
 * Hook for tracking user engagement
 */
export function useEngagementTracking() {
  const trackSearch = useCallback((searchTerm: string, resultsCount?: number) => {
    EngagementTracker.trackSearch(searchTerm, resultsCount);
  }, []);

  const trackAddToWishlist = useCallback((product: AnalyticsProduct) => {
    EngagementTracker.trackAddToWishlist(product);
  }, []);

  const trackSignUp = useCallback((method: string = 'email') => {
    EngagementTracker.trackSignUp(method);
  }, []);

  const trackLogin = useCallback((method: string = 'email') => {
    EngagementTracker.trackLogin(method);
  }, []);

  const trackViewItemList = useCallback(
    (products: AnalyticsProduct[], listName: string, listId?: string) => {
      EngagementTracker.trackViewItemList(products, listName, listId);
    },
    []
  );

  const trackSelectItem = useCallback(
    (product: AnalyticsProduct, listName: string, listId?: string) => {
      EngagementTracker.trackSelectItem(product, listName, listId);
    },
    []
  );

  const trackCustomEvent = useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => {
      EngagementTracker.trackCustomEvent(eventName, eventData);
    },
    []
  );

  return {
    trackSearch,
    trackAddToWishlist,
    trackSignUp,
    trackLogin,
    trackViewItemList,
    trackSelectItem,
    trackCustomEvent,
  };
}

/**
 * Hook for tracking user funnels
 */
export function useFunnelTracking() {
  const startFunnel = useCallback((funnelName: string) => {
    FunnelTracker.startFunnel(funnelName);
  }, []);

  const addStep = useCallback((stepName: string) => {
    FunnelTracker.addStep(stepName);
  }, []);

  const completeFunnel = useCallback(() => {
    FunnelTracker.completeFunnel();
  }, []);

  const abandonFunnel = useCallback((reason?: string) => {
    FunnelTracker.abandonFunnel(reason);
  }, []);

  return {
    startFunnel,
    addStep,
    completeFunnel,
    abandonFunnel,
  };
}

/**
 * Combined analytics hook with all tracking capabilities
 */
export function useAnalytics() {
  const conversion = useConversionTracking();
  const engagement = useEngagementTracking();
  const funnel = useFunnelTracking();

  return {
    conversion,
    engagement,
    funnel,
  };
}
