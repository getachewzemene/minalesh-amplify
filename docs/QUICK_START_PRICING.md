# Quick Start Guide: Pricing, Shipping & Tax

This guide will help you quickly get started with the new pricing, shipping, and tax features.

## 1. Initial Setup

### Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all new tables)
npx prisma migrate deploy
```

### Seed Initial Data

```bash
# Seed Ethiopian shipping zones and tax rates
npm run db:seed:shipping-tax
```

This creates:
- ✅ 3 shipping zones (Addis Ababa, Major Cities, Regional)
- ✅ 3 shipping methods (Standard, Express, Pickup)
- ✅ 6 shipping rates
- ✅ Ethiopian VAT (15%)

## 2. Create Your First Coupon

### Via Admin API

```bash
curl -X POST http://localhost:3000/api/admin/coupons \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "description": "10% off for new customers",
    "discountType": "percentage",
    "discountValue": 10,
    "minimumPurchase": 100,
    "usageLimit": 100,
    "perUserLimit": 1,
    "startsAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### Via Prisma Client

```typescript
import prisma from '@/lib/prisma';

const coupon = await prisma.coupon.create({
  data: {
    code: 'WELCOME10',
    description: '10% off for new customers',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchase: 100,
    usageLimit: 100,
    perUserLimit: 1,
    startsAt: new Date('2025-01-01'),
    expiresAt: new Date('2025-12-31'),
  },
});
```

## 3. Apply Coupon in Checkout

### Client-Side Implementation

```typescript
// components/checkout/CouponInput.tsx
import { useState } from 'react';

function CouponInput({ subtotal, onCouponApplied }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyCoupon = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });

      const result = await response.json();

      if (result.valid) {
        onCouponApplied(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter coupon code"
      />
      <button onClick={applyCoupon} disabled={loading}>
        Apply
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## 4. Calculate Shipping Rates

### Get Available Shipping Options

```typescript
// Get shipping rates for customer address
const getShippingOptions = async (address, cartSubtotal, totalWeight) => {
  const response = await fetch('/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: {
        country: 'ET',
        city: address.city,
        region: address.region,
      },
      subtotal: cartSubtotal,
      totalWeight: totalWeight,
    }),
  });

  const result = await response.json();
  return result.options;
};

// Example usage
const options = await getShippingOptions(
  { country: 'ET', city: 'Addis Ababa' },
  500, // subtotal in ETB
  2.5  // weight in kg
);

// Display options to customer
options.forEach(option => {
  console.log(`${option.name}: ${option.rate} ETB (${option.estimatedDaysMin}-${option.estimatedDaysMax} days)`);
});
```

## 5. Complete Checkout Calculation

### Calculate Final Total

```typescript
// Calculate complete order total with all pricing rules
const calculateOrderTotal = async (
  subtotal,
  couponCode,
  shippingRateId,
  shippingAddress
) => {
  const response = await fetch('/api/cart/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subtotal,
      couponCode,
      shippingRateId,
      shippingAddress,
    }),
  });

  return await response.json();
};

// Example usage
const orderTotal = await calculateOrderTotal(
  500,                    // cart subtotal
  'WELCOME10',           // coupon code
  'shipping-rate-id',    // selected shipping rate
  {
    country: 'ET',
    city: 'Addis Ababa'
  }
);

console.log('Order Summary:');
console.log(`Subtotal: ${orderTotal.subtotal} ETB`);
console.log(`Discount: -${orderTotal.discountAmount} ETB`);
console.log(`Shipping: ${orderTotal.shippingAmount} ETB`);
console.log(`Tax (VAT 15%): ${orderTotal.taxAmount} ETB`);
console.log(`Total: ${orderTotal.total} ETB`);
```

## 6. Create a Promotion

### Time-Limited Promotion

```typescript
// Create a summer sale promotion
const promotion = await prisma.promotion.create({
  data: {
    name: 'Summer Sale',
    description: '20% off all products',
    promotionType: 'cart_discount',
    discountType: 'percentage',
    discountValue: 20,
    minimumPurchase: 200,
    startsAt: new Date('2025-06-01'),
    endsAt: new Date('2025-08-31'),
    isActive: true,
    priority: 1,
  },
});
```

### Category-Specific Promotion

```typescript
// Create promotion for specific category
const promotion = await prisma.promotion.create({
  data: {
    name: 'Coffee Sale',
    promotionType: 'category_discount',
    discountType: 'percentage',
    discountValue: 15,
    categoryIds: [coffeeCategoryId],
    startsAt: new Date(),
    isActive: true,
  },
});
```

## 7. Create a Flash Sale

### Via Admin API

```typescript
const flashSale = await fetch('/api/admin/flash-sales', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '24-Hour Flash Sale',
    description: 'Limited time offer',
    productId: 'product-uuid',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: 150,
    flashPrice: 105,
    stockLimit: 100,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
  }),
});
```

## 8. Set Up Tiered Pricing

### Bulk Purchase Discounts

```typescript
// Create tiered pricing for a product
const tiers = [
  {
    productId: 'coffee-product-id',
    minQuantity: 1,
    maxQuantity: 9,
    discountType: 'percentage',
    discountValue: 0, // No discount
  },
  {
    productId: 'coffee-product-id',
    minQuantity: 10,
    maxQuantity: 49,
    discountType: 'percentage',
    discountValue: 10, // 10% off
  },
  {
    productId: 'coffee-product-id',
    minQuantity: 50,
    maxQuantity: null, // unlimited
    discountType: 'percentage',
    discountValue: 20, // 20% off
  },
];

for (const tier of tiers) {
  await prisma.tieredPricing.create({ data: tier });
}
```

## 9. Frontend Integration Examples

### Order Summary Component

```tsx
// components/checkout/OrderSummary.tsx
import { useEffect, useState } from 'react';

export function OrderSummary({ cartItems, couponCode, shippingRateId, address }) {
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateTotal();
  }, [cartItems, couponCode, shippingRateId, address]);

  const calculateTotal = async () => {
    setLoading(true);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const response = await fetch('/api/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal,
        couponCode,
        shippingRateId,
        shippingAddress: address,
      }),
    });

    const result = await response.json();
    setCalculation(result);
    setLoading(false);
  };

  if (loading || !calculation) {
    return <div>Calculating...</div>;
  }

  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      <div className="summary-row">
        <span>Subtotal:</span>
        <span>{calculation.subtotal} ETB</span>
      </div>
      {calculation.discountAmount > 0 && (
        <div className="summary-row discount">
          <span>Discount:</span>
          <span>-{calculation.discountAmount} ETB</span>
        </div>
      )}
      <div className="summary-row">
        <span>Shipping:</span>
        <span>{calculation.shippingAmount} ETB</span>
      </div>
      <div className="summary-row">
        <span>VAT (15%):</span>
        <span>{calculation.taxAmount} ETB</span>
      </div>
      <div className="summary-row total">
        <span>Total:</span>
        <span>{calculation.total} ETB</span>
      </div>
    </div>
  );
}
```

## 10. Common Scenarios

### Scenario 1: Free Shipping Coupon

```typescript
// Create free shipping coupon
await prisma.coupon.create({
  data: {
    code: 'FREESHIP',
    discountType: 'free_shipping',
    discountValue: 0,
    minimumPurchase: 500,
    usageLimit: 50,
  },
});

// Apply in checkout - shipping will be 0
```

### Scenario 2: Buy X Get Y Promotion

```typescript
// Create BOGO promotion
await prisma.promotion.create({
  data: {
    name: 'Buy 2 Get 1 Free',
    promotionType: 'buy_x_get_y',
    discountType: 'percentage',
    discountValue: 33.33, // Effectively makes 3rd item free
    buyQuantity: 2,
    getQuantity: 1,
    startsAt: new Date(),
    isActive: true,
  },
});
```

### Scenario 3: Check Active Promotions

```typescript
// Get all active promotions for a product
const response = await fetch(`/api/promotions?productId=${productId}`);
const { promotions } = await response.json();

// Display badges/banners
promotions.forEach(promo => {
  console.log(`Active: ${promo.name} - ${promo.discountValue}% off`);
});
```

## Troubleshooting

### Issue: Coupon not applying
- Check coupon status is 'active'
- Verify dates are current
- Check usage limits haven't been reached
- Ensure minimum purchase is met

### Issue: Shipping not calculating
- Verify address has required fields (country, city)
- Check if shipping zone exists for location
- Ensure shipping methods are active

### Issue: Tax not applying
- Verify tax rates exist for country
- Check address is complete
- Ensure tax rates are marked as active

## Next Steps

1. ✅ Test coupon validation in staging
2. ✅ Create initial promotional campaigns
3. ✅ Configure shipping zones for all regions
4. ✅ Set up monitoring for discount usage
5. ✅ Train customer support on new features

## Additional Resources

- [Full Documentation](./PRICING_SHIPPING_TAX.md)
- [API Reference](./PRICING_SHIPPING_TAX.md#api-reference)
- [Admin Management](../README.md#admin-product-management)

---

Need help? Check the main documentation or contact the development team.
