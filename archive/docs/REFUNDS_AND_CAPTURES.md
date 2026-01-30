# Refunds & Partial Captures Documentation

This document describes the implementation of refunds and partial payment captures in the Minalesh marketplace platform.

## Table of Contents

1. [Overview](#overview)
2. [Refunds](#refunds)
3. [Partial Captures](#partial-captures)
4. [Payment Provider Integration](#payment-provider-integration)
5. [API Reference](#api-reference)
6. [Testing](#testing)

---

## Overview

The platform now supports:
- **Full Refunds**: Refund the entire order amount
- **Partial Refunds**: Refund a portion of the order amount
- **Payment Captures**: Capture authorized payments (full or partial amounts)
- **Provider Integration**: Support for Stripe and Ethiopian payment providers (TeleBirr, CBE, Awash Bank)

---

## Refunds

### Features

- Full and partial refund support
- Automatic stock restoration (configurable)
- Provider-specific refund processing
- Complete audit trail with refund history
- Validation to prevent refunding more than order total

### Refund Process

1. **Initiate Refund**: Create a refund request
2. **Validate**: Check order status and refund amount
3. **Process**: Call payment provider API to process refund
4. **Update Status**: Mark refund as completed/failed
5. **Restore Stock** (optional): Return items to inventory

### API Endpoints

#### POST /api/refunds

Initiate a refund for an order.

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 500.00,
  "reason": "Customer request",
  "restoreStock": true
}
```

**Response:**
```json
{
  "success": true,
  "refundId": "uuid"
}
```

#### GET /api/refunds?orderId={uuid}

Get all refunds for an order and the remaining refundable amount.

**Response:**
```json
{
  "refunds": [
    {
      "id": "uuid",
      "amount": 500.00,
      "status": "completed",
      "reason": "Customer request",
      "provider": "stripe",
      "providerRefundId": "re_123",
      "createdAt": "2024-01-01T12:00:00Z",
      "processedAt": "2024-01-01T12:05:00Z"
    }
  ],
  "refundableAmount": 500.00
}
```

### Refund Statuses

- `pending`: Refund initiated, awaiting processing
- `completed`: Refund successfully processed by payment provider
- `failed`: Refund processing failed

### Code Example

```typescript
import { initiateRefund, processRefund } from '@/lib/refund';

// Initiate a partial refund
const result = await initiateRefund({
  orderId: 'order-123',
  amount: 500,
  reason: 'Damaged item',
  restoreStock: true,
});

if (result.success && result.refundId) {
  // Process refund with payment provider
  await processRefund(result.refundId);
}
```

---

## Partial Captures

### Overview

Partial captures allow you to authorize a payment but only capture a portion of it. This is useful for:
- Pre-authorization holds
- Adjusted order amounts
- Tip adjustments
- Partial fulfillment

### Features

- Authorize payment without immediate capture
- Capture full or partial amounts
- Multiple partial captures (if supported by provider)
- Final capture flag to prevent further captures

### Capture Process

1. **Create Payment Intent**: Set `captureMethod: 'manual'` when creating payment intent
2. **Authorize Payment**: Customer authorizes the full amount
3. **Capture Payment**: Capture full or partial amount when ready
4. **Update Order**: Mark order as paid when captured

### API Endpoints

#### POST /api/payments/capture

Capture payment for an order.

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 750.00,
  "finalCapture": true
}
```

**Response:**
```json
{
  "success": true,
  "captureId": "pi_123",
  "capturedAmount": 750.00
}
```

#### GET /api/payments/capture?orderId={uuid}

Get capture status for an order.

**Response:**
```json
{
  "orderId": "uuid",
  "orderNumber": "ORDER-123",
  "totalAmount": 1000.00,
  "paymentStatus": "pending",
  "paymentMethod": "stripe",
  "isCapturable": true,
  "paidAt": null
}
```

### Code Example

```typescript
import { capturePayment } from '@/lib/capture';

// Create payment intent with manual capture
const intent = await stripe.paymentIntents.create({
  amount: 100000, // $1000.00
  currency: 'usd',
  capture_method: 'manual',
});

// Later, capture a partial amount
const result = await capturePayment({
  orderId: 'order-123',
  amount: 750, // Capture $750 instead of full $1000
  finalCapture: true,
});
```

---

## Payment Provider Integration

### Stripe

**Refunds:**
```typescript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: 50000, // Amount in cents
});
```

**Captures:**
```typescript
const paymentIntent = await stripe.paymentIntents.capture(
  paymentIntentId,
  { amount_to_capture: 50000 }
);
```

### Ethiopian Payment Providers

#### TeleBirr (Mobile Payment)

Placeholder implementation ready for TeleBirr API integration:

```typescript
// Refund
const response = await fetch('https://api.telebirr.et/v1/refunds', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payment_reference: paymentReference,
    amount: refundAmount,
    currency: 'ETB',
  }),
});

// Capture
const response = await fetch('https://api.telebirr.et/v1/captures', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payment_reference: paymentReference,
    amount: captureAmount,
    currency: 'ETB',
  }),
});
```

#### CBE (Commercial Bank of Ethiopia)

Placeholder implementation ready for CBE API integration:

```typescript
// Similar structure to TeleBirr
// Replace with actual CBE API endpoints and authentication
```

#### Awash Bank

Placeholder implementation ready for Awash Bank API integration:

```typescript
// Similar structure to TeleBirr
// Replace with actual Awash Bank API endpoints and authentication
```

### Environment Variables

Configure provider API keys:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Ethiopian Providers (when APIs are available)
TELEBIRR_API_KEY=your_telebirr_key
CBE_API_KEY=your_cbe_key
AWASH_API_KEY=your_awash_key
```

---

## API Reference

### Refund Library (`src/lib/refund.ts`)

#### `initiateRefund(request: RefundRequest): Promise<RefundResult>`

Initiates a refund for an order.

**Parameters:**
- `orderId` (string): UUID of the order
- `amount` (number): Refund amount in ETB
- `reason` (optional string): Reason for refund
- `restoreStock` (optional boolean): Whether to restore items to inventory (default: true)

**Returns:**
- `success` (boolean): Whether refund was initiated
- `refundId` (optional string): ID of created refund
- `error` (optional string): Error message if failed

#### `processRefund(refundId: string): Promise<boolean>`

Processes a refund with the payment provider.

#### `getRefundableAmount(orderId: string): Promise<number>`

Calculates remaining refundable amount for an order.

### Capture Library (`src/lib/capture.ts`)

#### `capturePayment(request: CaptureRequest): Promise<CaptureResult>`

Captures payment for an order.

**Parameters:**
- `orderId` (string): UUID of the order
- `amount` (optional number): Amount to capture (defaults to full order total)
- `finalCapture` (optional boolean): Whether this is the final capture (default: true)

**Returns:**
- `success` (boolean): Whether capture was successful
- `captureId` (optional string): ID of the capture
- `capturedAmount` (optional number): Amount that was captured
- `error` (optional string): Error message if failed

#### `getCaptureStatus(orderId: string): Promise<CaptureStatus | null>`

Gets capture status for an order.

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test src/__tests__/refunds.test.ts
npm test src/__tests__/capture.test.ts
```

### Test Coverage

**Refunds:**
- Full refund processing
- Partial refund processing
- Refund validation (amount, order status)
- Stock restoration
- Multiple refunds on same order
- Refundable amount calculation

**Captures:**
- Full payment capture
- Partial payment capture
- Capture validation (amount, payment status)
- Multiple captures (if supported)
- Manual payment handling (COD)
- Stripe integration

### Example Tests

```typescript
import { initiateRefund, getRefundableAmount } from '@/lib/refund';
import { capturePayment } from '@/lib/capture';

// Test partial refund
test('should process partial refund', async () => {
  const result = await initiateRefund({
    orderId: 'order-123',
    amount: 500,
  });
  
  expect(result.success).toBe(true);
  expect(result.refundId).toBeDefined();
  
  const refundable = await getRefundableAmount('order-123');
  expect(refundable).toBe(500); // If order total was 1000
});

// Test partial capture
test('should capture partial payment', async () => {
  const result = await capturePayment({
    orderId: 'order-123',
    amount: 750,
    finalCapture: false,
  });
  
  expect(result.success).toBe(true);
  expect(result.capturedAmount).toBe(750);
});
```

---

## Security Considerations

1. **Authorization**: Only order owners and admins can initiate refunds/captures
2. **Validation**: Prevent refunding/capturing more than order total
3. **Idempotency**: Provider refund/capture IDs tracked to prevent duplicates
4. **Audit Trail**: All refunds and captures logged in order events
5. **Provider Verification**: Webhook signature verification for provider callbacks

---

## Future Enhancements

- [ ] Automated refund approval workflow
- [ ] Refund reason categories
- [ ] Partial refund allocation to order items
- [ ] Support for subscription refunds
- [ ] Batch refund processing
- [ ] Advanced partial capture scenarios (multiple captures)
- [ ] Refund analytics dashboard
- [ ] Email notifications for refunds/captures
