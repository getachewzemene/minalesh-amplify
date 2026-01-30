# Analytics Integration Guide

This guide explains how to use the comprehensive analytics integration in Minalesh Marketplace, which includes Google Analytics 4, Google Tag Manager, and Facebook Pixel.

## Table of Contents

1. [Setup](#setup)
2. [Components](#components)
3. [Usage](#usage)
4. [Tracking Events](#tracking-events)
5. [Best Practices](#best-practices)

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-pixel-id
```

### 2. Cookie Consent

All analytics tracking respects user cookie preferences. The system checks for `minalesh-cookie-preferences` in localStorage and only tracks when users have given consent for analytics cookies.

## Components

### GoogleAnalytics
Integrates Google Analytics 4 for web analytics and e-commerce tracking.

### GoogleTagManager
Integrates Google Tag Manager for advanced tag management and custom event tracking.

### FacebookPixel
Integrates Facebook Pixel for ad conversion tracking and retargeting.

All three components are automatically included in the root layout and will only load when:
1. The respective environment variable is set
2. The user has given cookie consent

## Usage

### Using Hooks (Recommended)

The easiest way to track events is using the provided React hooks:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function ProductPage({ product }) {
  const { conversion, engagement } = useAnalytics();

  useEffect(() => {
    // Track product view
    conversion.trackProductView({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      brand: product.brand,
    });
  }, [product]);

  const handleAddToCart = () => {
    // Track add to cart
    conversion.trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  );
}
```

### Using Tracker Classes Directly

For more control, you can use the tracker classes:

```typescript
import { ConversionTracker, EngagementTracker } from '@/lib/analytics-tracker';

// Track product view
ConversionTracker.trackProductView({
  id: 'prod-123',
  name: 'Product Name',
  price: 999.99,
  category: 'Electronics',
});

// Track search
EngagementTracker.trackSearch('laptop', 42);
```

## Tracking Events

### E-commerce Events

#### 1. Product View
```typescript
conversion.trackProductView({
  id: 'prod-123',
  name: 'Wireless Headphones',
  price: 2999.99,
  category: 'Electronics/Audio',
  brand: 'TechBrand',
  currency: 'ETB',
});
```

#### 2. Add to Cart
```typescript
conversion.trackAddToCart({
  id: 'prod-123',
  name: 'Wireless Headphones',
  price: 2999.99,
  quantity: 1,
});
```

#### 3. Remove from Cart
```typescript
conversion.trackRemoveFromCart({
  id: 'prod-123',
  name: 'Wireless Headphones',
  price: 2999.99,
  quantity: 1,
});
```

#### 4. View Cart
```typescript
const products = [/* array of products */];
const totalValue = 5999.98;
conversion.trackViewCart(products, totalValue);
```

#### 5. Begin Checkout
```typescript
conversion.trackBeginCheckout(products, totalValue, 'DISCOUNT10');
```

#### 6. Add Shipping Info
```typescript
conversion.trackAddShippingInfo(products, totalValue, 50, 'Standard Shipping');
// Parameters: products, totalValue, shippingCost (number), shippingTier (string label)
```

#### 7. Add Payment Info
```typescript
conversion.trackAddPaymentInfo(products, totalValue, 'Credit Card');
```

#### 8. Purchase (Conversion)
```typescript
conversion.trackPurchase({
  transactionId: 'order-12345',
  products: products,
  totalValue: 6149.98,
  shipping: 100,
  tax: 50,
  coupon: 'DISCOUNT10',
});
```

### User Engagement Events

#### 1. Search
```typescript
engagement.trackSearch('wireless headphones', 24); // search term, results count
```

#### 2. Add to Wishlist
```typescript
engagement.trackAddToWishlist({
  id: 'prod-123',
  name: 'Product Name',
  price: 999.99,
});
```

#### 3. Sign Up
```typescript
engagement.trackSignUp('email'); // or 'google', 'facebook'
```

#### 4. Login
```typescript
engagement.trackLogin('email');
```

#### 5. View Item List
```typescript
engagement.trackViewItemList(
  products,
  'Featured Products',
  'featured-list'
);
```

#### 6. Select Item
```typescript
engagement.trackSelectItem(
  product,
  'Search Results',
  'search-results'
);
```

#### 7. Custom Events
```typescript
engagement.trackCustomEvent('newsletter_signup', {
  source: 'footer',
  email_domain: 'gmail.com',
});
```

### Funnel Tracking

Track user flows through your conversion funnels:

```typescript
import { useFunnelTracking } from '@/hooks/useAnalytics';

function CheckoutFlow() {
  const { startFunnel, addStep, completeFunnel, abandonFunnel } = useFunnelTracking();

  useEffect(() => {
    startFunnel('Checkout');
  }, []);

  const handleCartView = () => {
    addStep('View Cart');
  };

  const handleShippingInfo = () => {
    addStep('Shipping Info');
  };

  const handlePaymentInfo = () => {
    addStep('Payment Info');
  };

  const handleOrderComplete = () => {
    addStep('Order Complete');
    completeFunnel();
  };

  const handleAbandon = () => {
    abandonFunnel('User closed browser');
  };

  // ... component logic
}
```

### Page View Tracking

Automatic page view tracking is handled by the analytics components. For manual page view tracking in SPAs:

```typescript
import { usePageTracking } from '@/hooks/useAnalytics';

function MyApp() {
  usePageTracking(); // Tracks page views on route changes
  
  return <div>...</div>;
}
```

## Best Practices

### 1. Product Data Structure

Always use consistent product data:

```typescript
const product: AnalyticsProduct = {
  id: 'prod-123',           // Required: Unique product ID
  name: 'Product Name',     // Required: Product name
  price: 999.99,            // Required: Product price
  category: 'Category',     // Optional: Product category
  brand: 'Brand',           // Optional: Product brand
  quantity: 1,              // Optional: Quantity (default: 1)
  currency: 'ETB',          // Optional: Currency (default: 'ETB')
  variant: 'Blue',          // Optional: Product variant
  position: 0,              // Optional: Position in list
};
```

### 2. Conversion Funnel

Track the complete conversion funnel:

1. **Product View** → User sees product
2. **Add to Cart** → User adds product to cart
3. **View Cart** → User views their cart
4. **Begin Checkout** → User starts checkout
5. **Add Shipping Info** → User enters shipping
6. **Add Payment Info** → User enters payment
7. **Purchase** → User completes order

### 3. User Engagement

Track user engagement for better insights:

- **Search queries** for product discovery optimization
- **Wishlist additions** for interest indicators
- **Custom events** for feature usage

### 4. Testing

When testing analytics:

1. Use browser console to verify events
2. Check Network tab for tracking requests
3. Use Google Tag Assistant for GTM
4. Use Facebook Pixel Helper for Pixel events
5. Verify in Google Analytics Realtime reports

### 5. Privacy Compliance

- Always respect user cookie preferences
- Don't track sensitive personal information
- Anonymize IP addresses (already configured)
- Provide clear cookie policy and consent mechanism

## Platform-Specific Features

### Google Analytics 4

- Automatic page view tracking
- E-commerce events with full item details
- User properties and custom dimensions
- Cross-domain tracking support

### Google Tag Manager

- Custom event tracking via dataLayer
- Flexible tag management
- Server-side tagging support
- Custom variable support

### Facebook Pixel

- Standard e-commerce events
- Custom conversion tracking
- Audience building for retargeting
- Conversion optimization for ads

## Troubleshooting

### Events not showing up

1. Check environment variables are set
2. Verify user has given cookie consent
3. Check browser console for errors
4. Verify network requests in DevTools
5. Use browser extensions (Tag Assistant, Pixel Helper)

### Multiple events firing

- Ensure components don't trigger the same event multiple times
- Use proper dependency arrays in useEffect
- Consider debouncing user actions

### Data accuracy issues

- Ensure product data is consistent
- Verify currency and price formats
- Check for duplicate events
- Review GTM tag firing rules

## Example: Complete Checkout Flow

```typescript
import { useConversionTracking } from '@/hooks/useAnalytics';

function CheckoutPage() {
  const { 
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,
  } = useConversionTracking();

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const totalValue = calculateTotal(cartItems);

  // Step 1: Begin checkout
  useEffect(() => {
    if (step === 1) {
      trackBeginCheckout(cartItems, totalValue);
    }
  }, [step]);

  // Step 2: Shipping info
  const handleShippingSubmit = (shippingData) => {
    trackAddShippingInfo(cartItems, totalValue, shippingData.cost, shippingData.method);
    setStep(2);
  };

  // Step 3: Payment info
  const handlePaymentSubmit = (paymentData) => {
    trackAddPaymentInfo(cartItems, totalValue, paymentData.method);
    setStep(3);
  };

  // Step 4: Complete purchase
  const handleOrderComplete = (orderId) => {
    trackPurchase({
      transactionId: orderId,
      products: cartItems,
      totalValue: totalValue,
      shipping: 50,
      tax: 100,
    });
  };

  return (
    // ... checkout UI
  );
}
```

## Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Tag Manager Documentation](https://developers.google.com/tag-manager)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel)
- [E-commerce Tracking Best Practices](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

## Support

For questions or issues with analytics integration:

1. Check this documentation first
2. Review browser console for errors
3. Test with browser analytics extensions
4. Consult platform-specific documentation
5. Contact the development team
