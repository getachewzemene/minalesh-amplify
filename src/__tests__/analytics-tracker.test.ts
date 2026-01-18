import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window.gtag
const mockGtag = vi.fn();
const mockFbq = vi.fn();
const mockDataLayer: unknown[] = [];

// Setup window mocks
beforeEach(() => {
  global.window = {
    gtag: mockGtag,
    fbq: mockFbq,
    dataLayer: mockDataLayer,
  } as any;
});

afterEach(() => {
  vi.clearAllMocks();
  mockDataLayer.length = 0;
});

// Import after mocking
import {
  ConversionTracker,
  EngagementTracker,
  FunnelTracker,
  type AnalyticsProduct,
} from '@/lib/analytics-tracker';

describe('Analytics Tracker', () => {
  const mockProduct: AnalyticsProduct = {
    id: 'prod-123',
    name: 'Test Product',
    category: 'Electronics',
    brand: 'TestBrand',
    price: 999.99,
    quantity: 1,
    currency: 'ETB',
  };

  describe('ConversionTracker', () => {
    it('should track product view across all platforms', () => {
      ConversionTracker.trackProductView(mockProduct);

      // Should call gtag for Google Analytics
      expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', expect.any(Object));

      // Should call fbq for Facebook Pixel
      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.any(Object));

      // Should push to dataLayer for GTM
      expect(mockDataLayer.length).toBeGreaterThan(0);
      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'view_item');
      expect(gtmEvent).toBeDefined();
    });

    it('should track add to cart with correct parameters', () => {
      ConversionTracker.trackAddToCart(mockProduct);

      // Verify gtag call
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'add_to_cart',
        expect.objectContaining({
          currency: 'ETB',
          value: mockProduct.price,
        })
      );

      // Verify fbq call
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'AddToCart',
        expect.objectContaining({
          content_ids: [mockProduct.id],
          value: mockProduct.price,
        })
      );
    });

    it('should track remove from cart', () => {
      ConversionTracker.trackRemoveFromCart(mockProduct);

      expect(mockGtag).toHaveBeenCalledWith('event', 'remove_from_cart', expect.any(Object));
      
      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'remove_from_cart');
      expect(gtmEvent).toBeDefined();
    });

    it('should track view cart with multiple products', () => {
      const products = [mockProduct, { ...mockProduct, id: 'prod-456' }];
      const totalValue = 1999.98;

      ConversionTracker.trackViewCart(products, totalValue);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'view_cart',
        expect.objectContaining({
          currency: 'ETB',
          value: totalValue,
        })
      );
    });

    it('should track begin checkout', () => {
      const products = [mockProduct];
      const totalValue = 999.99;
      const coupon = 'SAVE10';

      ConversionTracker.trackBeginCheckout(products, totalValue, coupon);

      // Verify GA
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'begin_checkout',
        expect.objectContaining({
          value: totalValue,
          coupon,
        })
      );

      // Verify FB
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'InitiateCheckout',
        expect.objectContaining({
          value: totalValue,
        })
      );
    });

    it('should track purchase with all details', () => {
      const params = {
        transactionId: 'txn-123',
        products: [mockProduct],
        totalValue: 999.99,
        shipping: 50,
        tax: 100,
        coupon: 'SAVE10',
      };

      ConversionTracker.trackPurchase(params);

      // Verify GA
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'purchase',
        expect.objectContaining({
          transaction_id: params.transactionId,
          value: params.totalValue,
          shipping: params.shipping,
          tax: params.tax,
        })
      );

      // Verify FB
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'Purchase',
        expect.objectContaining({
          value: params.totalValue,
        })
      );

      // Verify GTM
      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'purchase');
      expect(gtmEvent).toBeDefined();
      expect(gtmEvent).toMatchObject({
        event: 'purchase',
        ecommerce: expect.objectContaining({
          transaction_id: params.transactionId,
        }),
      });
    });
  });

  describe('EngagementTracker', () => {
    it('should track search across all platforms', () => {
      const searchTerm = 'laptop';
      const resultsCount = 42;

      EngagementTracker.trackSearch(searchTerm, resultsCount);

      // Verify GA
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({
          search_term: searchTerm,
        })
      );

      // Verify FB
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'Search',
        expect.objectContaining({
          search_string: searchTerm,
        })
      );

      // Verify GTM
      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'search');
      expect(gtmEvent).toBeDefined();
    });

    it('should track add to wishlist', () => {
      EngagementTracker.trackAddToWishlist(mockProduct);

      expect(mockGtag).toHaveBeenCalledWith('event', 'add_to_wishlist', expect.any(Object));
      expect(mockFbq).toHaveBeenCalledWith('track', 'AddToWishlist', expect.any(Object));
    });

    it('should track sign up', () => {
      const method = 'google';

      EngagementTracker.trackSignUp(method);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'sign_up',
        expect.objectContaining({ method })
      );

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'CompleteRegistration',
        expect.any(Object)
      );
    });

    it('should track login', () => {
      const method = 'email';

      EngagementTracker.trackLogin(method);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'login',
        expect.objectContaining({ method })
      );
    });

    it('should track view item list', () => {
      const products = [mockProduct, { ...mockProduct, id: 'prod-456' }];
      const listName = 'Featured Products';
      const listId = 'featured-list';

      EngagementTracker.trackViewItemList(products, listName, listId);

      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'view_item_list');
      expect(gtmEvent).toBeDefined();
      expect(gtmEvent).toMatchObject({
        event: 'view_item_list',
        ecommerce: expect.objectContaining({
          item_list_id: listId,
          item_list_name: listName,
        }),
      });
    });

    it('should track select item', () => {
      const listName = 'Search Results';

      EngagementTracker.trackSelectItem(mockProduct, listName);

      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'select_item');
      expect(gtmEvent).toBeDefined();
    });

    it('should track custom events', () => {
      const eventName = 'custom_action';
      const eventData = { action: 'test', value: 123 };

      EngagementTracker.trackCustomEvent(eventName, eventData);

      const gtmEvent = mockDataLayer.find((item: any) => item.event === eventName);
      expect(gtmEvent).toBeDefined();

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', eventName, eventData);
    });
  });

  describe('FunnelTracker', () => {
    let tracker: FunnelTracker;

    beforeEach(() => {
      tracker = new FunnelTracker();
    });

    it('should track funnel start', () => {
      const funnelName = 'Checkout Funnel';

      tracker.startFunnel(funnelName);

      const gtmEvent = mockDataLayer.find((item: any) => item.event === 'funnel_start');
      expect(gtmEvent).toBeDefined();
      expect(gtmEvent).toMatchObject({
        event: 'funnel_start',
        funnel_name: funnelName,
      });
    });

    it('should track funnel steps', () => {
      tracker.startFunnel('Purchase Funnel');
      tracker.addStep('View Product');
      tracker.addStep('Add to Cart');

      const stepEvents = mockDataLayer.filter((item: any) => item.event === 'funnel_step');
      expect(stepEvents.length).toBe(2);
    });

    it('should track funnel completion', () => {
      tracker.startFunnel('Purchase Funnel');
      tracker.addStep('Checkout');
      tracker.completeFunnel();

      const completeEvent = mockDataLayer.find((item: any) => item.event === 'funnel_complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent).toMatchObject({
        event: 'funnel_complete',
        total_steps: expect.any(Number),
        duration_ms: expect.any(Number),
      });
    });

    it('should track funnel abandonment', () => {
      tracker.startFunnel('Checkout Funnel');
      tracker.addStep('Cart');
      tracker.abandonFunnel('User navigated away');

      const abandonEvent = mockDataLayer.find((item: any) => item.event === 'funnel_abandon');
      expect(abandonEvent).toBeDefined();
      expect(abandonEvent).toMatchObject({
        event: 'funnel_abandon',
        abandon_reason: 'User navigated away',
      });
    });

    it('should track funnel path correctly', () => {
      tracker.startFunnel('Registration Funnel');
      tracker.addStep('Email Entry');
      tracker.addStep('Profile Setup');
      tracker.addStep('Verification');
      tracker.completeFunnel();

      const completeEvent = mockDataLayer.find((item: any) => item.event === 'funnel_complete');
      expect(completeEvent?.funnel_path).toBe(
        'Registration Funnel > Email Entry > Profile Setup > Verification'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle products without optional fields', () => {
      const minimalProduct: AnalyticsProduct = {
        id: 'prod-min',
        name: 'Minimal Product',
        price: 100,
      };

      expect(() => {
        ConversionTracker.trackProductView(minimalProduct);
      }).not.toThrow();
    });

    it('should use default currency when not specified', () => {
      const productWithoutCurrency: AnalyticsProduct = {
        id: 'prod-no-currency',
        name: 'No Currency Product',
        price: 500,
      };

      ConversionTracker.trackAddToCart(productWithoutCurrency);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'add_to_cart',
        expect.objectContaining({
          currency: 'ETB',
        })
      );
    });

    it('should handle empty product arrays', () => {
      expect(() => {
        ConversionTracker.trackViewCart([], 0);
      }).not.toThrow();
    });

    it('should handle search without results count', () => {
      expect(() => {
        EngagementTracker.trackSearch('test query');
      }).not.toThrow();
    });
  });
});
