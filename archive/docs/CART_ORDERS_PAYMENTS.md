# Cart, Orders, and Payments System

Complete documentation for the cart, order, and payment systems with inventory management and concurrency safety.

## Table of Contents

1. [Cart System](#cart-system)
2. [Order Management](#order-management)
3. [Payment Integration](#payment-integration)
4. [Inventory Reservation](#inventory-reservation)
5. [API Reference](#api-reference)
6. [Testing](#testing)

---

## Cart System

### Features

✅ **Persistent Storage** - Cart items stored in PostgreSQL database
✅ **User & Anonymous Support** - Works for both logged-in users and guests
✅ **Session Management** - Anonymous carts tied to session ID
✅ **Merge on Login** - Anonymous cart automatically merged with user cart on login
✅ **Concurrency Safe** - Transaction-based updates prevent race conditions
✅ **Stock Validation** - Real-time stock checking prevents adding unavailable items

### Cart API Endpoints

#### Get Cart Items
```http
GET /api/cart
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id} (for anonymous users)

Response:
{
  "items": [
    {
      "id": "cart-item-id",
      "productId": "product-id",
      "quantity": 2,
      "unitPrice": "150.00",
      "total": 300.00,
      "product": {
        "name": "Ethiopian Coffee",
        "price": "150.00",
        "images": [...]
      }
    }
  ],
  "subtotal": 300.00,
  "itemCount": 2
}
```

#### Add to Cart
```http
POST /api/cart
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id} (for anonymous users)

Body:
{
  "productId": "product-uuid",
  "variantId": "variant-uuid", // optional
  "quantity": 1
}

Response:
{
  "id": "cart-item-id",
  "productId": "product-id",
  "quantity": 1,
  "product": {...}
}
```

#### Update Cart Item
```http
PUT /api/cart/items/{itemId}
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id}

Body:
{
  "quantity": 3
}

Response:
{
  "id": "cart-item-id",
  "quantity": 3,
  "product": {...}
}
```

#### Remove Cart Item
```http
DELETE /api/cart/items/{itemId}
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id}

Response:
{
  "message": "Item removed from cart"
}
```

#### Clear Cart
```http
DELETE /api/cart
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id}

Response:
{
  "message": "Cart cleared successfully"
}
```

#### Merge Cart on Login
```http
POST /api/cart/merge
Headers:
  Authorization: Bearer {token} (required)

Body:
{
  "sessionId": "anonymous-session-id"
}

Response:
{
  "message": "Cart merged successfully",
  "mergedCount": 2,
  "updatedCount": 1,
  "totalItems": 3
}
```

### Cart Concurrency Safety

The cart system uses database transactions to prevent race conditions:

```typescript
// Before update, re-check stock within transaction
await prisma.$transaction(async (tx) => {
  // Get fresh stock data
  const currentProduct = await tx.product.findUnique({
    where: { id: cartItem.productId },
    select: { stockQuantity: true },
  });

  // Validate availability
  if (currentProduct.stockQuantity < newQuantity) {
    throw new Error('Insufficient stock');
  }

  // Update cart item
  return await tx.cart.update({
    where: { id: itemId },
    data: { quantity: newQuantity },
  });
});
```

---

## Order Management

### Order Status State Machine

Valid order status transitions:

```
pending → paid, cancelled
paid → confirmed, cancelled, refunded
confirmed → processing, cancelled, refunded
processing → fulfilled, cancelled, refunded
fulfilled → shipped, cancelled, refunded
shipped → delivered, refunded
delivered → refunded
cancelled → (terminal state)
refunded → (terminal state)
```

### Order Schema

```typescript
{
  id: string;
  orderNumber: string; // e.g., "MIN-1731583200000"
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  
  // Pricing breakdown
  subtotal: Decimal; // Sum of item prices
  discountAmount: Decimal; // Applied discounts
  shippingAmount: Decimal; // Shipping cost
  taxAmount: Decimal; // VAT/taxes
  totalAmount: Decimal; // Final total
  
  currency: string; // "ETB"
  
  // Addresses
  shippingAddress: JSON;
  billingAddress: JSON;
  
  // Timestamps for each status
  paidAt?: DateTime;
  confirmedAt?: DateTime;
  processingAt?: DateTime;
  fulfilledAt?: DateTime;
  shippedAt?: DateTime;
  deliveredAt?: DateTime;
  cancelledAt?: DateTime;
  refundedAt?: DateTime;
  
  // Relations
  orderItems: OrderItem[];
  coupon?: Coupon;
  shippingMethod?: ShippingMethod;
}
```

### Order API Endpoints

#### Create Order (Legacy - for COD/TeleBirr)
```http
POST /api/orders
Headers:
  Authorization: Bearer {token}

Body:
{
  "items": [
    {
      "id": "product-uuid",
      "quantity": 2
    }
  ],
  "paymentMethod": "COD" | "TeleBirr" | "CBE" | "Awash" | "BankTransfer",
  "paymentMeta": {
    "phone": "0912345678",
    "reference": "TXN-123"
  },
  "shippingAddress": {
    "name": "John Doe",
    "phone": "0912345678",
    "line1": "123 Main St",
    "city": "Addis Ababa",
    "country": "ET"
  }
}
```

#### Get User Orders
```http
GET /api/orders
Headers:
  Authorization: Bearer {token}

Response:
[
  {
    "id": "order-id",
    "orderNumber": "MIN-1731583200000",
    "status": "delivered",
    "totalAmount": "567.50",
    "orderItems": [...]
  }
]
```

#### Get Order Details
```http
GET /api/orders/{orderId}
Headers:
  Authorization: Bearer {token}

Response:
{
  "id": "order-id",
  "orderNumber": "MIN-1731583200000",
  "status": "delivered",
  "paymentStatus": "completed",
  "subtotal": "500.00",
  "discountAmount": "50.00",
  "shippingAmount": "50.00",
  "taxAmount": "67.50",
  "totalAmount": "567.50",
  "orderItems": [...],
  "shippingAddress": {...}
}
```

#### Update Order Status (Admin/Vendor)
```http
PUT /api/orders/{orderId}/status
Headers:
  Authorization: Bearer {token}

Body:
{
  "status": "shipped",
  "notes": "Shipped via DHL"
}

Response:
{
  "id": "order-id",
  "status": "shipped",
  "shippedAt": "2024-11-14T10:30:00Z"
}

Error (Invalid Transition):
{
  "error": "Invalid status transition from 'pending' to 'shipped'. Valid transitions: paid, cancelled"
}
```

---

## Payment Integration

### Stripe Payment Intent Flow

```
1. Client → POST /api/payments/create-intent
   ↓
2. Server creates order with status=pending
   ↓
3. Server reserves inventory (soft lock, 15min expiry)
   ↓
4. Server creates Stripe PaymentIntent
   ↓
5. Server returns clientSecret to client
   ↓
6. Client completes payment with Stripe.js
   ↓
7. Stripe → POST /api/payments/webhook (payment success)
   ↓
8. Server commits reservations (decrement stock)
   ↓
9. Server updates order: status=paid, paymentStatus=completed
```

### Payment Intent Endpoint

#### Create Payment Intent
```http
POST /api/payments/create-intent
Headers:
  Authorization: Bearer {token}

Body:
{
  "items": [
    {
      "productId": "product-uuid",
      "variantId": "variant-uuid", // optional
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "phone": "0912345678",
    "line1": "123 Main St",
    "city": "Addis Ababa",
    "country": "ET"
  },
  "couponCode": "WELCOME10", // optional
  "shippingMethodId": "method-uuid" // optional
}

Response:
{
  "success": true,
  "order": {
    "id": "order-id",
    "orderNumber": "MIN-1731583200000",
    "subtotal": "500.00",
    "discountAmount": "50.00",
    "shippingAmount": "50.00",
    "taxAmount": "67.50",
    "totalAmount": "567.50",
    "currency": "ETB"
  },
  "reservations": ["res-id-1", "res-id-2"],
  "stripePaymentIntent": {
    "id": "pi_...",
    "clientSecret": "pi_...secret_..."
  },
  "expiresAt": "2024-11-14T10:45:00Z"
}

Error (Insufficient Stock):
{
  "error": "Insufficient stock: 2 available, 5 requested"
}
```

### Payment Webhook

#### Handle Payment Webhook
```http
POST /api/payments/webhook
Headers:
  x-webhook-signature: {hmac-sha256-signature}
  OR
  x-telebirr-signature: {provider-signature}

Body:
{
  "provider": "TeleBirr" | "Stripe" | "CBE" | "Awash",
  "status": "completed" | "failed" | "pending",
  "orderNumber": "MIN-1731583200000",
  "paymentReference": "TXN-123",
  "amount": "567.50",
  "meta": {
    "eventId": "unique-event-id"
  }
}

Response (Success):
{
  "ok": true,
  "order": {
    "id": "order-id",
    "status": "paid",
    "paymentStatus": "completed",
    "paidAt": "2024-11-14T10:30:00Z"
  }
}

Response (Idempotent):
{
  "ok": true,
  "message": "Already processed"
}

Error (Unauthorized):
{
  "error": "Unauthorized"
}
```

### Webhook Security

Webhooks are secured using HMAC-SHA256 signatures:

```typescript
// Compute signature
const signature = crypto
  .createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

// Verify signature (timing-safe comparison)
const isValid = crypto.timingSafeEqual(
  Buffer.from(expectedSignature, 'utf8'),
  Buffer.from(receivedSignature, 'utf8')
);
```

### Webhook Idempotency

Webhooks are idempotent using the `webhook_events` table:

- Events are deduplicated by `(provider, eventId)`
- Already processed events return success immediately
- Failed events can be retried

---

## Inventory Reservation

### Overview

The inventory reservation system prevents overselling by "soft-locking" stock during the checkout process.

### Reservation States

1. **active** - Reservation is valid and holding stock
2. **committed** - Reservation finalized (stock decremented)
3. **released** - Reservation cancelled (stock freed)
4. **expired** - Reservation timed out (auto-released by cron)

### Reservation Lifecycle

```
1. Payment Intent Created
   ↓ Reserve inventory (status=active, expires in 15min)
   
2a. Payment Success
   ↓ Commit reservation (status=committed)
   ↓ Decrement stock
   ↓ Order status=paid
   
2b. Payment Failure
   ↓ Release reservation (status=released)
   ↓ Stock remains available
   
2c. Payment Abandoned (15min timeout)
   ↓ Cron job expires reservation (status=expired)
   ↓ Stock becomes available again
```

### Inventory API

#### Reserve Stock
```http
POST /api/inventory/reserve
Headers:
  Authorization: Bearer {token} (optional)
  x-session-id: {session-id} (if not authenticated)

Body:
{
  "productId": "product-uuid",
  "variantId": "variant-uuid", // optional
  "quantity": 2
}

Response:
{
  "success": true,
  "reservationId": "reservation-uuid",
  "availableStock": 8
}

Error:
{
  "error": "Insufficient stock: 5 available, 10 requested"
}
```

#### Check Available Stock
```http
GET /api/inventory/reserve?productId={uuid}&variantId={uuid}

Response:
{
  "productId": "product-uuid",
  "variantId": "variant-uuid",
  "availableStock": 8  // Physical stock - active reservations
}
```

#### Release Reservation
```http
DELETE /api/inventory/reserve?reservationId={uuid}

Response:
{
  "success": true
}
```

### Concurrency Safety

Reservations use database transactions with FOR UPDATE locks:

```typescript
await prisma.$transaction(async (tx) => {
  // Get current stock with lock
  const product = await tx.product.findUnique({
    where: { id: productId },
  });

  // Calculate reserved quantity
  const reservedQty = await tx.inventoryReservation.aggregate({
    where: {
      productId,
      status: 'active',
      expiresAt: { gt: new Date() },
    },
    _sum: { quantity: true },
  });

  const available = product.stockQuantity - (reservedQty._sum.quantity || 0);

  // Only create reservation if stock available
  if (available < quantity) {
    throw new Error('Insufficient stock');
  }

  return await tx.inventoryReservation.create({
    data: { productId, quantity, status: 'active', ... },
  });
});
```

### Reservation Cleanup

#### Manual Cleanup (Cron Job)
```http
GET /api/cron/cleanup-reservations
Headers:
  Authorization: Bearer {CRON_SECRET}

Response:
{
  "success": true,
  "cleanedCount": 15,
  "timestamp": "2024-11-14T10:30:00Z"
}
```

**Recommended Schedule:** Every 5-15 minutes

**Setup Examples:**

```bash
# Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/cleanup-reservations",
      "schedule": "*/10 * * * *"
    }
  ]
}

# GitHub Actions (.github/workflows/cron.yml)
on:
  schedule:
    - cron: '*/10 * * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Reservations
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://yourapp.com/api/cron/cleanup-reservations

# AWS EventBridge
# Create a rule with schedule: rate(10 minutes)
# Target: Lambda function that calls the API
```

---

## API Reference

### Status Codes

- `200` - Success
- `400` - Bad Request (validation error, insufficient stock)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (race condition, concurrent modification)
- `422` - Unprocessable Entity (schema validation failed)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "issues": [
    {
      "path": ["field"],
      "message": "Validation error"
    }
  ]
}
```

### Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token from `/api/auth/login` or `/api/auth/register`.

### Role-Based Access

- **Customer** - Can manage own cart, create orders, view own orders
- **Vendor** - Can view orders containing their products
- **Admin** - Can view all orders, update order status, access admin endpoints

---

## Testing

### Unit Tests

Run the test suite:

```bash
npm test
```

### Test Coverage

- ✅ Cart operations (add, update, remove, merge)
- ✅ Order creation with stock validation
- ✅ Order status transitions
- ✅ Payment webhook processing
- ✅ Inventory reservation race conditions
- ✅ Concurrent checkout scenarios
- ✅ Available stock calculations

### Manual Testing

#### Test Concurrent Checkout

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/inventory/reserve \
  -H "Content-Type: application/json" \
  -H "x-session-id: session-1" \
  -d '{"productId":"prod-123","quantity":5}'

# Terminal 2 (simultaneously)
curl -X POST http://localhost:3000/api/inventory/reserve \
  -H "Content-Type: application/json" \
  -H "x-session-id: session-2" \
  -d '{"productId":"prod-123","quantity":5}'

# Verify: If product has <10 stock, one should fail with "Insufficient stock"
```

#### Test Payment Flow

```bash
# 1. Create payment intent
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "items": [{"productId":"prod-123","quantity":1}],
    "shippingAddress": {...}
  }'

# 2. Simulate webhook (payment success)
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: {computed-signature}" \
  -d '{
    "provider": "TeleBirr",
    "status": "completed",
    "orderNumber": "MIN-..."
  }'

# 3. Verify order status
curl http://localhost:3000/api/orders/{orderId} \
  -H "Authorization: Bearer {token}"
```

---

## Environment Variables

```bash
# Required for production
JWT_SECRET=strong-random-secret
DATABASE_URL=postgresql://...

# Payment providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYMENT_WEBHOOK_SECRET=webhook-secret

# Provider-specific webhooks
TELEBIRR_WEBHOOK_SECRET=telebirr-secret
CBE_WEBHOOK_SECRET=cbe-secret
AWASH_WEBHOOK_SECRET=awash-secret

# Background jobs
CRON_SECRET=cron-secret

# Internal services
INTERNAL_API_SECRET=internal-secret
```

---

## Best Practices

### Cart Management

1. **Use Session IDs** - Generate consistent session IDs for anonymous users
2. **Merge on Login** - Always call `/api/cart/merge` after authentication
3. **Validate Stock** - Check stock before checkout, not just on add-to-cart
4. **Clear Cart** - Clear cart after successful order creation

### Order Processing

1. **Use Payment Intents** - Prefer payment intents over direct order creation
2. **Validate Transitions** - Use status validation to prevent invalid state changes
3. **Track Events** - Order events provide full audit trail
4. **Handle Failures** - Release inventory on payment failures

### Inventory Management

1. **Reserve Early** - Create reservations at payment intent, not order creation
2. **Set Expiry** - Default 15 minutes is reasonable for most checkouts
3. **Monitor Cleanup** - Run cleanup cron frequently to free stuck inventory
4. **Handle Edge Cases** - Account for expired reservations in stock checks

### Payment Security

1. **Verify Signatures** - Always validate webhook signatures
2. **Use Idempotency** - Store event IDs to prevent duplicate processing
3. **Log Everything** - Track all payment events for debugging
4. **Test Webhooks** - Use provider test modes to validate integration

---

## Troubleshooting

### Cart Items Not Persisting

**Issue:** Cart items disappear on refresh

**Solution:**
- Ensure `x-session-id` header is consistent across requests
- For authenticated users, ensure JWT token is valid
- Check database for cart records

### Inventory Overselling

**Issue:** Products sold beyond available stock

**Solution:**
- Verify reservations are being created on payment intent
- Check that cleanup cron is running regularly
- Ensure transactions are used for stock checks
- Review concurrent checkout test results

### Payment Webhooks Failing

**Issue:** Webhooks return 401 Unauthorized

**Solution:**
- Verify `PAYMENT_WEBHOOK_SECRET` matches provider configuration
- Check signature generation matches provider format
- Ensure raw body is used for signature (not parsed JSON)
- Review webhook logs in provider dashboard

### Order Status Transitions Rejected

**Issue:** Status update returns "Invalid transition"

**Solution:**
- Check current order status
- Review state machine for valid transitions
- Use order events to track status history
- Admin can manually fix stuck orders via database if needed

---

## Support

For issues or questions:
1. Check this documentation
2. Review test files for examples
3. Check server logs for detailed errors
4. Review Sentry for error tracking (if configured)
