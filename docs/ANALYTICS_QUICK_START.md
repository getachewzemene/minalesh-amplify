# Analytics Quick Start Guide

Quick reference for implementing analytics tracking in Minalesh Marketplace.

## Setup

1. Add to `.env`:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-pixel-id
```

2. Components auto-load in root layout (already configured)

## Basic Usage

### Import the hook
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { conversion, engagement, funnel } = useAnalytics();
  // ... use tracking functions
}
```

## Common Events

### Product View
```typescript
conversion.trackProductView({
  id: product.id,
  name: product.name,
  price: product.price,
  category: product.category,
});
```

### Add to Cart
```typescript
conversion.trackAddToCart({
  id: product.id,
  name: product.name,
  price: product.price,
  quantity: 1,
});
```

### Search
```typescript
engagement.trackSearch(searchTerm, resultsCount);
```

### Purchase
```typescript
conversion.trackPurchase({
  transactionId: order.id,
  products: cartItems,
  totalValue: total,
  shipping: shippingCost,
  tax: taxAmount,
});
```

### User Actions
```typescript
engagement.trackSignUp('email');
engagement.trackLogin('email');
engagement.trackAddToWishlist(product);
```

### Custom Events
```typescript
engagement.trackCustomEvent('newsletter_signup', {
  source: 'footer',
  campaign: 'holiday2024',
});
```

## Funnel Tracking

```typescript
const { startFunnel, addStep, completeFunnel } = useFunnelTracking();

// Start
startFunnel('Checkout');

// Track steps
addStep('View Cart');
addStep('Shipping Info');
addStep('Payment Info');

// Complete
completeFunnel();
```

## Product Data Structure

```typescript
{
  id: 'prod-123',        // Required
  name: 'Product Name',  // Required
  price: 999.99,         // Required
  category: 'Category',  // Optional
  brand: 'Brand',        // Optional
  quantity: 1,           // Optional (default: 1)
  currency: 'ETB',       // Optional (default: 'ETB')
}
```

## Testing

Check events in browser:
1. Open DevTools Console
2. Network tab → Filter "gtag" or "fbq"
3. Use Google Tag Assistant extension
4. Use Facebook Pixel Helper extension

## More Info

See [ANALYTICS_INTEGRATION.md](./ANALYTICS_INTEGRATION.md) for complete documentation.
