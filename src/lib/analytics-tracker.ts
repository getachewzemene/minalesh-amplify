/**
 * Analytics Utility Library
 * Provides unified interface for tracking events across multiple analytics platforms:
 * - Google Analytics 4
 * - Google Tag Manager
 * - Facebook Pixel
 */

import {
  trackAddToCart as trackGAAddToCart,
  trackRemoveFromCart as trackGARemoveFromCart,
  trackViewProduct as trackGAViewProduct,
  trackViewCart as trackGAViewCart,
  trackBeginCheckout as trackGABeginCheckout,
  trackAddShippingInfo as trackGAAddShippingInfo,
  trackAddPaymentInfo as trackGAAddPaymentInfo,
  trackPurchase as trackGAPurchase,
  trackSearch as trackGASearch,
  trackSignUp as trackGASignUp,
  trackLogin as trackGALogin,
  trackAddToWishlist as trackGAAddToWishlist,
} from '../components/analytics/GoogleAnalytics';

import {
  trackFBAddToCart,
  trackFBAddToWishlist,
  trackFBViewContent,
  trackFBSearch,
  trackFBInitiateCheckout,
  trackFBAddPaymentInfo,
  trackFBPurchase,
  trackFBCompleteRegistration,
  trackFBCustomEvent,
} from '../components/analytics/FacebookPixel';

import {
  trackGTMEvent,
  pushToDataLayer,
} from '../components/analytics/GoogleTagManager';

// Product interface for analytics
export interface AnalyticsProduct {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  price: number;
  quantity?: number;
  currency?: string;
  variant?: string;
  position?: number;
}

// Conversion funnel tracking
export class ConversionTracker {
  // Track product view (top of funnel)
  static trackProductView(product: AnalyticsProduct) {
    // Google Analytics
    trackGAViewProduct({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_brand: product.brand,
      price: product.price,
      currency: product.currency || 'ETB',
    });

    // Facebook Pixel
    trackFBViewContent({
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_type: 'product',
      value: product.price,
      currency: product.currency || 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('view_item', {
      ecommerce: {
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
          currency: product.currency || 'ETB',
        }],
      },
    });
  }

  // Track add to cart
  static trackAddToCart(product: AnalyticsProduct) {
    // Google Analytics
    trackGAAddToCart({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_brand: product.brand,
      price: product.price,
      quantity: product.quantity || 1,
      currency: product.currency || 'ETB',
    });

    // Facebook Pixel
    trackFBAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * (product.quantity || 1),
      currency: product.currency || 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('add_to_cart', {
      ecommerce: {
        currency: product.currency || 'ETB',
        value: product.price * (product.quantity || 1),
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          quantity: product.quantity || 1,
          price: product.price,
        }],
      },
    });
  }

  // Track remove from cart
  static trackRemoveFromCart(product: AnalyticsProduct) {
    // Google Analytics
    trackGARemoveFromCart({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: product.quantity || 1,
      currency: product.currency || 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('remove_from_cart', {
      ecommerce: {
        currency: product.currency || 'ETB',
        value: product.price * (product.quantity || 1),
        items: [{
          item_id: product.id,
          item_name: product.name,
          quantity: product.quantity || 1,
          price: product.price,
        }],
      },
    });
  }

  // Track view cart
  static trackViewCart(products: AnalyticsProduct[], totalValue: number) {
    const items = products.map(p => ({
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      item_brand: p.brand,
      price: p.price,
      quantity: p.quantity || 1,
      currency: p.currency || 'ETB',
    }));

    // Google Analytics
    trackGAViewCart(items, totalValue);

    // Google Tag Manager
    trackGTMEvent('view_cart', {
      ecommerce: {
        currency: 'ETB',
        value: totalValue,
        items,
      },
    });
  }

  // Track begin checkout
  static trackBeginCheckout(products: AnalyticsProduct[], totalValue: number, coupon?: string) {
    const items = products.map(p => ({
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      item_brand: p.brand,
      price: p.price,
      quantity: p.quantity || 1,
      currency: p.currency || 'ETB',
    }));

    // Google Analytics
    trackGABeginCheckout({
      currency: 'ETB',
      value: totalValue,
      items,
      coupon,
    });

    // Facebook Pixel
    trackFBInitiateCheckout({
      content_ids: products.map(p => p.id),
      num_items: products.reduce((sum, p) => sum + (p.quantity || 1), 0),
      value: totalValue,
      currency: 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('begin_checkout', {
      ecommerce: {
        currency: 'ETB',
        value: totalValue,
        coupon,
        items,
      },
    });
  }

  // Track add shipping info
  static trackAddShippingInfo(products: AnalyticsProduct[], totalValue: number, shippingTier?: string) {
    const items = products.map(p => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      quantity: p.quantity || 1,
      currency: p.currency || 'ETB',
    }));

    // Google Analytics
    trackGAAddShippingInfo({
      currency: 'ETB',
      value: totalValue,
      items,
      shipping: shippingTier ? parseFloat(shippingTier) : undefined,
    });

    // Google Tag Manager
    trackGTMEvent('add_shipping_info', {
      ecommerce: {
        currency: 'ETB',
        value: totalValue,
        shipping_tier: shippingTier,
        items,
      },
    });
  }

  // Track add payment info
  static trackAddPaymentInfo(products: AnalyticsProduct[], totalValue: number, paymentType?: string) {
    const items = products.map(p => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      quantity: p.quantity || 1,
      currency: p.currency || 'ETB',
    }));

    // Google Analytics
    trackGAAddPaymentInfo({
      currency: 'ETB',
      value: totalValue,
      items,
    });

    // Facebook Pixel
    trackFBAddPaymentInfo({
      content_ids: products.map(p => p.id),
      value: totalValue,
      currency: 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('add_payment_info', {
      ecommerce: {
        currency: 'ETB',
        value: totalValue,
        payment_type: paymentType,
        items,
      },
    });
  }

  // Track purchase (conversion)
  static trackPurchase(params: {
    transactionId: string;
    products: AnalyticsProduct[];
    totalValue: number;
    shipping?: number;
    tax?: number;
    coupon?: string;
  }) {
    const items = params.products.map(p => ({
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      item_brand: p.brand,
      price: p.price,
      quantity: p.quantity || 1,
      currency: p.currency || 'ETB',
    }));

    // Google Analytics
    trackGAPurchase({
      transaction_id: params.transactionId,
      currency: 'ETB',
      value: params.totalValue,
      shipping: params.shipping,
      tax: params.tax,
      coupon: params.coupon,
      items,
    });

    // Facebook Pixel
    trackFBPurchase({
      content_ids: params.products.map(p => p.id),
      value: params.totalValue,
      currency: 'ETB',
      num_items: params.products.reduce((sum, p) => sum + (p.quantity || 1), 0),
      content_type: 'product',
    });

    // Google Tag Manager
    trackGTMEvent('purchase', {
      ecommerce: {
        transaction_id: params.transactionId,
        currency: 'ETB',
        value: params.totalValue,
        shipping: params.shipping,
        tax: params.tax,
        coupon: params.coupon,
        items,
      },
    });
  }
}

// User engagement tracking
export class EngagementTracker {
  // Track search
  static trackSearch(searchTerm: string, resultsCount?: number) {
    // Google Analytics
    trackGASearch(searchTerm);

    // Facebook Pixel
    trackFBSearch({
      search_string: searchTerm,
    });

    // Google Tag Manager
    trackGTMEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  // Track wishlist add
  static trackAddToWishlist(product: AnalyticsProduct) {
    // Google Analytics
    trackGAAddToWishlist({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      currency: product.currency || 'ETB',
    });

    // Facebook Pixel
    trackFBAddToWishlist({
      content_ids: [product.id],
      content_name: product.name,
      value: product.price,
      currency: product.currency || 'ETB',
    });

    // Google Tag Manager
    trackGTMEvent('add_to_wishlist', {
      ecommerce: {
        currency: product.currency || 'ETB',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
        }],
      },
    });
  }

  // Track user sign up
  static trackSignUp(method: string = 'email') {
    // Google Analytics
    trackGASignUp(method);

    // Facebook Pixel
    trackFBCompleteRegistration({
      content_name: 'User Registration',
      status: 'completed',
    });

    // Google Tag Manager
    trackGTMEvent('sign_up', {
      method,
    });
  }

  // Track user login
  static trackLogin(method: string = 'email') {
    // Google Analytics
    trackGALogin(method);

    // Google Tag Manager
    trackGTMEvent('login', {
      method,
    });
  }

  // Track product list view
  static trackViewItemList(products: AnalyticsProduct[], listName: string, listId?: string) {
    const items = products.map((p, index) => ({
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      item_brand: p.brand,
      price: p.price,
      currency: p.currency || 'ETB',
      index: p.position || index,
    }));

    // Google Tag Manager & GA4
    pushToDataLayer({
      event: 'view_item_list',
      ecommerce: {
        item_list_id: listId,
        item_list_name: listName,
        items,
      },
    });
  }

  // Track product selection from list
  static trackSelectItem(product: AnalyticsProduct, listName: string, listId?: string) {
    // Google Tag Manager & GA4
    pushToDataLayer({
      event: 'select_item',
      ecommerce: {
        item_list_id: listId,
        item_list_name: listName,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
          currency: product.currency || 'ETB',
          index: product.position,
        }],
      },
    });
  }

  // Track custom event
  static trackCustomEvent(eventName: string, eventData?: Record<string, unknown>) {
    // Google Tag Manager
    trackGTMEvent(eventName, eventData);

    // Facebook Pixel (for custom events)
    trackFBCustomEvent(eventName, eventData);
  }
}

// User flow and funnel visualization helpers
export class FunnelTracker {
  private static funnel: string[] = [];
  private static startTime: number = Date.now();

  // Start tracking a funnel
  static startFunnel(funnelName: string) {
    this.funnel = [funnelName];
    this.startTime = Date.now();
    
    pushToDataLayer({
      event: 'funnel_start',
      funnel_name: funnelName,
      timestamp: this.startTime,
    });
  }

  // Add step to funnel
  static addStep(stepName: string) {
    this.funnel.push(stepName);
    
    pushToDataLayer({
      event: 'funnel_step',
      funnel_path: this.funnel.join(' > '),
      step_name: stepName,
      step_number: this.funnel.length,
      time_since_start: Date.now() - this.startTime,
    });
  }

  // Complete funnel
  static completeFunnel() {
    const duration = Date.now() - this.startTime;
    
    pushToDataLayer({
      event: 'funnel_complete',
      funnel_path: this.funnel.join(' > '),
      total_steps: this.funnel.length,
      duration_ms: duration,
    });

    this.funnel = [];
  }

  // Abandon funnel
  static abandonFunnel(reason?: string) {
    const duration = Date.now() - this.startTime;
    
    pushToDataLayer({
      event: 'funnel_abandon',
      funnel_path: this.funnel.join(' > '),
      last_step: this.funnel[this.funnel.length - 1],
      step_number: this.funnel.length,
      duration_ms: duration,
      abandon_reason: reason,
    });

    this.funnel = [];
  }
}
