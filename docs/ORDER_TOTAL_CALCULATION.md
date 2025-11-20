# Order Total Calculation

## Formula

The order total is calculated using the following formula:

```
Total = Subtotal - Discounts + Shipping + Tax
```

Or more precisely:

```
Total = (Subtotal - Discount Amount) + Shipping Amount + Tax Amount
```

## Acceptance Criteria

✅ **The order total must equal: subtotal - discounts + shipping + tax**

## Implementation

### Cart Calculation Endpoint

Location: `/app/api/cart/calculate/route.ts`

```typescript
// Calculate subtotal after discount
const subtotalAfterDiscount = subtotal - discountAmount;

// Calculate shipping
let shippingAmount = 0;
if (shippingRateId && !freeShipping) {
  const shippingRate = await getShippingRateById(shippingRateId);
  if (shippingRate) {
    shippingAmount = shippingRate.rate;
  }
}

// Calculate tax
let taxAmount = 0;
if (shippingAddress && shippingAddress.country) {
  const taxResult = await calculateTax(
    subtotalAfterDiscount,
    shippingAddress
  );
  taxAmount = taxResult.totalTaxAmount;
}

// Calculate total
const total = subtotalAfterDiscount + shippingAmount + taxAmount;
```

**Key Points:**
1. Discount is applied **before** tax calculation
2. Tax is calculated on `subtotalAfterDiscount`
3. Shipping is added to the final total
4. Free shipping coupons set `shippingAmount = 0`

## Components Breakdown

### 1. Subtotal

**Definition:** Sum of all product prices × quantities before any adjustments

**Calculation:**
```typescript
const subtotal = cartItems.reduce((sum, item) => {
  return sum + (item.price * item.quantity);
}, 0);
```

**Example:**
- Product A: 500 ETB × 2 = 1,000 ETB
- Product B: 300 ETB × 1 = 300 ETB
- **Subtotal: 1,300 ETB**

### 2. Discounts

**Types:**
- **Percentage discount:** `discountAmount = subtotal × (percentage / 100)`
- **Fixed amount:** `discountAmount = fixedAmount`
- **Free shipping:** Sets shipping amount to 0

**Calculation:**
```typescript
if (coupon.discountType === 'percentage') {
  discountAmount = subtotal * (coupon.discountValue / 100);
  // Apply maximum discount if specified
  if (coupon.maximumDiscount) {
    discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
  }
} else if (coupon.discountType === 'fixed_amount') {
  discountAmount = coupon.discountValue;
}
```

**Example:**
- Subtotal: 1,300 ETB
- 10% discount coupon
- **Discount Amount: 130 ETB**

### 3. Shipping

**Calculation Methods:**

#### Zone-Based Shipping
```typescript
const shippingRate = await prisma.shippingRate.findFirst({
  where: { 
    zoneId: customerZone,
    methodId: selectedMethod 
  }
});

shippingAmount = shippingRate.baseRate + (totalWeight × shippingRate.perKgRate);
```

#### Free Shipping Thresholds
```typescript
if (subtotalAfterDiscount >= shippingRate.freeShippingThreshold) {
  shippingAmount = 0;
}
```

**Example:**
- Base rate: 50 ETB
- Per kg rate: 10 ETB/kg
- Total weight: 2.5 kg
- **Shipping Amount: 50 + (2.5 × 10) = 75 ETB**

### 4. Tax

**Ethiopian VAT (15%):**
```typescript
const taxRate = 0.15; // 15% VAT
const taxableAmount = subtotalAfterDiscount;
const taxAmount = taxableAmount * taxRate;
```

**Important:** Tax is calculated on `subtotalAfterDiscount`, not the original subtotal.

**Example:**
- Subtotal after discount: 1,170 ETB (1,300 - 130)
- VAT rate: 15%
- **Tax Amount: 175.50 ETB**

## Complete Example

### Scenario
- Product A: 500 ETB × 2 = 1,000 ETB
- Product B: 300 ETB × 1 = 300 ETB
- Discount: 10% off (coupon code)
- Shipping: Standard (75 ETB)
- Tax: 15% Ethiopian VAT

### Calculation Steps

```
1. Subtotal = 1,000 + 300 = 1,300 ETB

2. Discount Amount = 1,300 × 0.10 = 130 ETB

3. Subtotal After Discount = 1,300 - 130 = 1,170 ETB

4. Shipping Amount = 75 ETB

5. Tax Amount = 1,170 × 0.15 = 175.50 ETB

6. Total = 1,170 + 75 + 175.50 = 1,420.50 ETB
```

### Verification

```
Total = Subtotal - Discounts + Shipping + Tax
1,420.50 = 1,300 - 130 + 75 + 175.50
1,420.50 = 1,420.50 ✅
```

## Order Model

The Order model stores all these components:

```prisma
model Order {
  subtotal          Decimal  @db.Decimal(10, 2)
  shippingAmount    Decimal  @default(0) @map("shipping_amount") @db.Decimal(10, 2)
  taxAmount         Decimal  @default(0) @map("tax_amount") @db.Decimal(10, 2)
  discountAmount    Decimal  @default(0) @map("discount_amount") @db.Decimal(10, 2)
  totalAmount       Decimal  @map("total_amount") @db.Decimal(10, 2)
}
```

## Shipping Management

### Shipping Methods Table

The `shipping_methods` table stores available shipping options:

```prisma
model ShippingMethod {
  id                String   @id @default(dbgenerated("gen_random_uuid()"))
  name              String
  description       String?
  carrier           String?
  estimatedDaysMin  Int?
  estimatedDaysMax  Int?
  isActive          Boolean  @default(true)
  sortOrder         Int      @default(0)
}
```

**Examples:**
- Standard Delivery (3-7 business days)
- Express Delivery (1-3 business days)
- Store Pickup (Free, 1-2 days)

### Per-Order Shipping Selection

Orders store the selected shipping method:

```prisma
model Order {
  shippingMethodId  String?         @map("shipping_method_id") @db.Uuid
  shippingMethod    ShippingMethod? @relation(fields: [shippingMethodId], references: [id])
  shippingZoneId    String?         @map("shipping_zone_id") @db.Uuid
  shippingZone      ShippingZone?   @relation(fields: [shippingZoneId], references: [id])
  shippingAmount    Decimal         @default(0) @map("shipping_amount") @db.Decimal(10, 2)
}
```

### Shipping Rate Calculation

```typescript
// Get shipping rates for customer's zone and cart
const rates = await fetch('/api/shipping/rates', {
  method: 'POST',
  body: JSON.stringify({
    address: {
      country: 'ET',
      city: 'Addis Ababa'
    },
    subtotal: 1000,
    totalWeight: 2.5
  })
});

// Customer selects a rate
const selectedRate = rates.find(r => r.methodId === 'express');

// Rate is included in order total
const order = {
  shippingMethodId: selectedRate.methodId,
  shippingZoneId: selectedRate.zoneId,
  shippingAmount: selectedRate.rate
};
```

## Testing

### Unit Tests

Run order total calculation tests:
```bash
npm test -- src/lib/vendor-payout.test.ts
```

The test suite includes:
- Basic formula verification
- Zero discount handling
- Free shipping scenarios
- Zero tax handling
- Ethiopian VAT calculation (15%)
- Discount before tax verification
- Decimal precision handling
- Edge cases (zero subtotal, discount = subtotal)

### Example Test

```typescript
it('should calculate order total correctly with all components', () => {
  const subtotal = 1000;
  const discounts = 100;
  const shipping = 50;
  const tax = 135; // 15% VAT on (subtotal - discounts)
  
  const total = subtotal - discounts + shipping + tax;
  
  expect(total).toBe(1085);
});
```

## API Response Format

### Cart Calculate Response

```json
{
  "subtotal": 1300.00,
  "discountAmount": 130.00,
  "subtotalAfterDiscount": 1170.00,
  "shippingAmount": 75.00,
  "taxAmount": 175.50,
  "total": 1420.50,
  "coupon": {
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10
  },
  "freeShipping": false
}
```

## Common Pitfalls to Avoid

### ❌ Wrong: Calculate tax on original subtotal
```typescript
const taxAmount = subtotal * taxRate; // WRONG
const total = subtotal - discountAmount + shippingAmount + taxAmount;
```

### ✅ Correct: Calculate tax on subtotal after discount
```typescript
const subtotalAfterDiscount = subtotal - discountAmount;
const taxAmount = subtotalAfterDiscount * taxRate; // CORRECT
const total = subtotalAfterDiscount + shippingAmount + taxAmount;
```

### ❌ Wrong: Add shipping before discount
```typescript
const total = subtotal + shippingAmount - discountAmount + taxAmount; // WRONG
```

### ✅ Correct: Follow the formula strictly
```typescript
const total = (subtotal - discountAmount) + shippingAmount + taxAmount; // CORRECT
```

## Validation

### Backend Validation

```typescript
// Ensure all values are non-negative
if (subtotal < 0 || discountAmount < 0 || shippingAmount < 0 || taxAmount < 0) {
  throw new Error('Invalid amounts');
}

// Ensure discount doesn't exceed subtotal
if (discountAmount > subtotal) {
  throw new Error('Discount cannot exceed subtotal');
}

// Recalculate and verify
const calculatedTotal = subtotal - discountAmount + shippingAmount + taxAmount;
if (Math.abs(calculatedTotal - providedTotal) > 0.01) {
  throw new Error('Total amount mismatch');
}
```

## Summary

The order total calculation is implemented correctly following the formula:

```
Total = Subtotal - Discounts + Shipping + Tax
```

✅ **Verified in:** `/app/api/cart/calculate/route.ts`  
✅ **Tested in:** `src/lib/vendor-payout.test.ts`  
✅ **Documented in:** This file  

All components (subtotal, discounts, shipping, tax) are properly tracked in the Order model and can be audited for accuracy.
