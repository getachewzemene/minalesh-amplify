# Pricing Rules, Shipping & Tax System Documentation

## Overview

This document describes the comprehensive pricing rules, shipping, and tax system implemented for the Minalesh e-commerce platform, specifically designed for the Ethiopian market.

## Table of Contents

1. [Database Models](#database-models)
2. [Pricing Rules](#pricing-rules)
3. [Shipping System](#shipping-system)
4. [Tax Calculation](#tax-calculation)
5. [API Reference](#api-reference)
6. [Usage Examples](#usage-examples)

## Database Models

### Coupon

Manages promotional coupon codes.

**Fields:**
- `code` - Unique coupon code (uppercase)
- `discountType` - Type of discount (percentage, fixed_amount, free_shipping)
- `discountValue` - Value of the discount
- `minimumPurchase` - Minimum cart value required
- `maximumDiscount` - Maximum discount cap for percentage discounts
- `usageLimit` - Total number of times coupon can be used
- `usageCount` - Current usage count
- `perUserLimit` - Maximum uses per user
- `startsAt` - When coupon becomes valid
- `expiresAt` - When coupon expires
- `status` - Current status (active, inactive, expired, depleted)

**Relationships:**
- Has many `CouponUsage` records
- Has many `Order` records

### Promotion

Automatic promotional discounts.

**Fields:**
- `name` - Promotion name
- `promotionType` - Type (product_discount, category_discount, cart_discount, buy_x_get_y)
- `discountType` - Discount type
- `discountValue` - Discount amount
- `productIds` - Array of product IDs (for product-specific promotions)
- `categoryIds` - Array of category IDs (for category promotions)
- `minimumQuantity` - Minimum items required
- `minimumPurchase` - Minimum cart value
- `buyQuantity` - Buy quantity (for Buy X Get Y)
- `getQuantity` - Get quantity (for Buy X Get Y)
- `priority` - Priority for stacking multiple promotions
- `startsAt` - Start date
- `endsAt` - End date

### TieredPricing

Quantity-based pricing discounts.

**Fields:**
- `productId` - Associated product
- `minQuantity` - Minimum quantity for this tier
- `maxQuantity` - Maximum quantity (null for unlimited)
- `discountType` - Type of discount
- `discountValue` - Discount amount

**Example:**
```
Tier 1: 1-9 items = 0% discount
Tier 2: 10-49 items = 5% discount
Tier 3: 50+ items = 10% discount
```

### FlashSale

Time-limited sales events.

**Fields:**
- `productId` - Product on sale
- `originalPrice` - Regular price
- `flashPrice` - Sale price
- `stockLimit` - Limited quantity available
- `stockSold` - Number sold
- `startsAt` - Sale start time
- `endsAt` - Sale end time

### ShippingZone

Geographic shipping zones.

**Fields:**
- `name` - Zone name
- `countries` - Array of country codes (default: ["ET"])
- `regions` - Array of regions (Ethiopian regions)
- `cities` - Array of cities
- `postalCodes` - Array of postal codes

**Ethiopian Zones:**
1. Addis Ababa - Capital city
2. Major Cities - Dire Dawa, Bahir Dar, Gondar, Mekelle, Hawassa, Adama
3. Regional Areas - Other cities and towns

### ShippingMethod

Shipping delivery methods.

**Fields:**
- `name` - Method name
- `carrier` - Carrier name
- `estimatedDaysMin` - Minimum delivery days
- `estimatedDaysMax` - Maximum delivery days
- `sortOrder` - Display order

**Ethiopian Methods:**
- Standard Delivery (3-7 days)
- Express Delivery (1-3 days)
- Store Pickup (1-2 days)

### ShippingRate

Zone and method-specific rates.

**Fields:**
- `zoneId` - Shipping zone
- `methodId` - Shipping method
- `baseRate` - Base shipping cost
- `perKgRate` - Additional cost per kg
- `freeShippingThreshold` - Cart value for free shipping
- `minOrderAmount` - Minimum cart value for this rate
- `maxOrderAmount` - Maximum cart value for this rate

### TaxRate

Tax rate configuration.

**Fields:**
- `name` - Tax name (e.g., "Ethiopian VAT")
- `rate` - Tax rate (e.g., 0.15 for 15%)
- `country` - Country code
- `region` - Region/state (optional)
- `city` - City (optional)
- `taxType` - Type of tax (VAT, Sales Tax, etc.)
- `isCompound` - Whether tax compounds on top of other taxes
- `priority` - Application order

**Ethiopian Tax:**
- Standard VAT: 15%
- Applied nationwide
- Certain categories exempt (basic food, medicine, books)

## Pricing Rules

### Priority Order

When multiple pricing rules apply, they are applied in this order:

1. **Flash Sales** - Highest priority, overrides base price
2. **Tiered Pricing** - Based on quantity
3. **Promotions** - Applied by priority field
4. **Coupon Codes** - Applied to subtotal after other discounts

### Discount Types

#### Percentage Discount
```typescript
discountAmount = (price * percentage) / 100
// With max cap:
discountAmount = min(calculatedDiscount, maxDiscount)
```

#### Fixed Amount
```typescript
discountAmount = min(fixedAmount, price)
```

#### Free Shipping
```typescript
shippingAmount = 0
```

### Tiered Pricing Example

```typescript
// Product: Coffee Beans
// Tier 1: 1-9 bags = 100 ETB each
// Tier 2: 10-49 bags = 10% off = 90 ETB each
// Tier 3: 50+ bags = 20% off = 80 ETB each

// Customer orders 25 bags
const applicableTier = findTier(25) // Returns Tier 2
const pricePerUnit = 100 - (100 * 0.10) // 90 ETB
const total = 90 * 25 // 2,250 ETB
```

## Shipping System

### Shipping Calculation Flow

1. Determine shipping zone based on address
2. Find available shipping methods for that zone
3. Calculate rate: `baseRate + (weight * perKgRate)`
4. Check if free shipping threshold is met
5. Return available options with pricing

### Ethiopian Shipping Rates

| Zone | Method | Base Rate | Per Kg | Free Shipping |
|------|--------|-----------|--------|---------------|
| Addis Ababa | Standard | 50 ETB | 10 ETB | 1,000 ETB |
| Addis Ababa | Express | 100 ETB | 20 ETB | 2,000 ETB |
| Addis Ababa | Pickup | 0 ETB | - | - |
| Major Cities | Standard | 100 ETB | 15 ETB | 1,500 ETB |
| Major Cities | Express | 200 ETB | 25 ETB | 3,000 ETB |
| Regional | Standard | 150 ETB | 20 ETB | 2,000 ETB |

### Address Matching

Zones are matched in order of specificity:
1. Country + Region + City
2. Country + Region
3. Country only

## Tax Calculation

### Ethiopian VAT

Ethiopia uses a standard Value Added Tax (VAT) of 15% on most goods and services.

```typescript
vatAmount = subtotal * 0.15
totalWithTax = subtotal + vatAmount
```

### Tax Calculation Order

1. Calculate subtotal (after discounts)
2. Add shipping charges
3. Determine taxable amount
4. Apply non-compound taxes
5. Apply compound taxes (if any)
6. Calculate final total

### Tax-Exempt Categories

Some categories may be VAT-exempt:
- Basic food items
- Medicine and medical supplies
- Books and educational materials
- Agricultural inputs
- Financial services

## API Reference

### Public APIs

#### POST /api/coupons/validate

Validate a coupon code and calculate discount.

**Request:**
```json
{
  "code": "WELCOME10",
  "subtotal": 500
}
```

**Response:**
```json
{
  "valid": true,
  "coupon": {
    "id": "...",
    "code": "WELCOME10",
    "discountType": "percentage",
    "discountValue": 10
  },
  "discountAmount": 50
}
```

#### GET /api/promotions

Get active promotions.

**Query Params:**
- `productId` - Filter by product
- `categoryId` - Filter by category

**Response:**
```json
{
  "promotions": [
    {
      "id": "...",
      "name": "Summer Sale",
      "discountType": "percentage",
      "discountValue": 20,
      "startsAt": "2025-06-01T00:00:00Z",
      "endsAt": "2025-08-31T23:59:59Z"
    }
  ]
}
```

#### POST /api/shipping/rates

Calculate shipping rates for an address.

**Request:**
```json
{
  "address": {
    "country": "ET",
    "city": "Addis Ababa"
  },
  "subtotal": 500,
  "totalWeight": 2.5
}
```

**Response:**
```json
{
  "options": [
    {
      "id": "...",
      "name": "Standard Delivery",
      "rate": 75,
      "estimatedDaysMin": 3,
      "estimatedDaysMax": 7
    },
    {
      "id": "...",
      "name": "Express Delivery",
      "rate": 150,
      "estimatedDaysMin": 1,
      "estimatedDaysMax": 3
    }
  ],
  "cheapestOption": { /* ... */ },
  "fastestOption": { /* ... */ }
}
```

#### POST /api/cart/calculate

Calculate complete cart totals with all pricing rules.

**Request:**
```json
{
  "subtotal": 500,
  "couponCode": "WELCOME10",
  "shippingRateId": "...",
  "shippingAddress": {
    "country": "ET",
    "city": "Addis Ababa"
  },
  "totalWeight": 2.5
}
```

**Response:**
```json
{
  "subtotal": 500,
  "discountAmount": 50,
  "subtotalAfterDiscount": 450,
  "shippingAmount": 50,
  "taxAmount": 67.50,
  "total": 567.50,
  "coupon": { /* ... */ },
  "freeShipping": false
}
```

### Admin APIs

All admin APIs require authentication and admin role.

#### GET /api/admin/coupons

List all coupons with pagination.

**Query Params:**
- `status` - Filter by status
- `page` - Page number (default: 1)
- `perPage` - Items per page (default: 20)

#### POST /api/admin/coupons

Create a new coupon.

**Request:**
```json
{
  "code": "SUMMER25",
  "description": "Summer sale discount",
  "discountType": "percentage",
  "discountValue": 25,
  "minimumPurchase": 200,
  "usageLimit": 100,
  "startsAt": "2025-06-01T00:00:00Z",
  "expiresAt": "2025-08-31T23:59:59Z"
}
```

#### GET /api/admin/promotions

List all promotions.

#### POST /api/admin/promotions

Create a new promotion.

#### GET /api/admin/flash-sales

List all flash sales.

#### POST /api/admin/flash-sales

Create a new flash sale.

#### GET /api/admin/shipping-zones

List all shipping zones with rates.

#### POST /api/admin/shipping-zones

Create a new shipping zone.

## Usage Examples

### Example 1: Apply Coupon to Cart

```typescript
// Customer has items totaling 500 ETB
const subtotal = 500;

// Validate coupon
const response = await fetch('/api/coupons/validate', {
  method: 'POST',
  body: JSON.stringify({
    code: 'WELCOME10',
    subtotal
  })
});

const result = await response.json();

if (result.valid) {
  const newSubtotal = subtotal - result.discountAmount;
  console.log(`Discount applied: ${result.discountAmount} ETB`);
  console.log(`New subtotal: ${newSubtotal} ETB`);
}
```

### Example 2: Calculate Shipping for Order

```typescript
// Get shipping options
const response = await fetch('/api/shipping/rates', {
  method: 'POST',
  body: JSON.stringify({
    address: {
      country: 'ET',
      city: 'Bahir Dar'
    },
    subtotal: 800,
    totalWeight: 3.2
  })
});

const { options, cheapestOption } = await response.json();

// Display options to customer
options.forEach(option => {
  console.log(`${option.name}: ${option.rate} ETB (${option.estimatedDaysMin}-${option.estimatedDaysMax} days)`);
});

// Use cheapest option by default
const selectedShipping = cheapestOption;
```

### Example 3: Complete Checkout Calculation

```typescript
// Calculate final total
const response = await fetch('/api/cart/calculate', {
  method: 'POST',
  body: JSON.stringify({
    subtotal: 800,
    couponCode: 'WELCOME10',
    shippingRateId: selectedShippingRateId,
    shippingAddress: {
      country: 'ET',
      city: 'Bahir Dar'
    },
    totalWeight: 3.2
  })
});

const calculation = await response.json();

// Display breakdown
console.log('Order Summary:');
console.log(`Subtotal: ${calculation.subtotal} ETB`);
console.log(`Discount: -${calculation.discountAmount} ETB`);
console.log(`Shipping: ${calculation.shippingAmount} ETB`);
console.log(`VAT (15%): ${calculation.taxAmount} ETB`);
console.log(`Total: ${calculation.total} ETB`);
```

### Example 4: Create Flash Sale (Admin)

```typescript
// Admin creates a flash sale
const response = await fetch('/api/admin/flash-sales', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    name: '24-Hour Coffee Sale',
    description: 'Special discount on Ethiopian coffee',
    productId: coffeeProductId,
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: 150,
    flashPrice: 105,
    stockLimit: 100,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
  })
});

const flashSale = await response.json();
console.log('Flash sale created:', flashSale);
```

## Best Practices

### Coupon Management

1. **Unique Codes**: Use descriptive, unique codes (e.g., SUMMER2025, WELCOME10)
2. **Usage Limits**: Set reasonable limits to prevent abuse
3. **Expiration**: Always set expiration dates
4. **Minimum Purchase**: Use to encourage larger orders
5. **Testing**: Test coupons before making them public

### Promotion Strategy

1. **Priority**: Set appropriate priorities for stacking
2. **Specificity**: Target specific products/categories when possible
3. **Duration**: Keep promotions time-bound
4. **Communication**: Inform customers of active promotions

### Shipping Configuration

1. **Zone Accuracy**: Ensure zones cover all delivery areas
2. **Rate Updates**: Regularly review and update rates
3. **Free Shipping**: Use strategically to increase average order value
4. **Delivery Times**: Set realistic estimates

### Tax Compliance

1. **Accuracy**: Ensure tax rates match current regulations
2. **Exemptions**: Properly configure exempt categories
3. **Documentation**: Keep records of tax calculations
4. **Updates**: Monitor for tax law changes

## Troubleshooting

### Common Issues

**Coupon not working:**
- Check status is 'active'
- Verify dates (not expired, has started)
- Check usage limits
- Verify minimum purchase requirement

**Shipping not calculating:**
- Ensure address is complete
- Check if zone exists for address
- Verify shipping methods are active
- Check order amount against min/max limits

**Tax not applying:**
- Verify tax rates are active
- Check address fields are populated
- Ensure tax rate exists for country/region

## Future Enhancements

Potential improvements for future versions:

1. **Multi-currency Support**: Support for USD, EUR alongside ETB
2. **Dynamic Tax Rates**: Real-time tax rate updates via API
3. **Carrier Integration**: Real-time rates from shipping carriers
4. **Advanced Promotions**: Time-based (happy hour), user-segment targeting
5. **Loyalty Programs**: Points-based rewards
6. **Gift Cards**: Digital gift card system
7. **Subscription Pricing**: Recurring billing support

## Support

For questions or issues with the pricing, shipping, or tax system, please:

1. Check this documentation
2. Review the API examples
3. Check the test files for usage patterns
4. Contact the development team

---

Last Updated: January 11, 2025
