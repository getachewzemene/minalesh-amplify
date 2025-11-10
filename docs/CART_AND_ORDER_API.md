# Cart and Order Lifecycle API Documentation

This document describes the cart management and order lifecycle APIs for the Minalesh e-commerce platform.

## Cart Management API

### Overview
The cart API provides persistent server-side cart functionality for both authenticated and anonymous users. Anonymous users are tracked via a session ID, and their carts are automatically merged when they log in.

### Headers
All cart endpoints support the following header for anonymous users:
- `x-session-id`: A UUID identifying the anonymous user's session
- `Authorization`: Bearer token for authenticated users (optional for cart, required after login)

### Endpoints

#### GET /api/cart
Fetch the current user's cart items with pricing calculations.

**Response:**
```json
{
  "items": [
    {
      "id": "cart-item-id",
      "productId": "product-id",
      "variantId": "variant-id",
      "quantity": 2,
      "product": {
        "name": "Product Name",
        "price": 100,
        "salePrice": 80,
        "images": ["url1", "url2"]
      },
      "variant": {
        "name": "Color: Red",
        "price": 90
      },
      "unitPrice": 80,
      "total": 160
    }
  ],
  "subtotal": 160,
  "itemCount": 2
}
```

#### POST /api/cart
Add an item to the cart or update quantity if item already exists.

**Request Body:**
```json
{
  "productId": "product-id",
  "variantId": "variant-id",  // optional
  "quantity": 1
}
```

**Response:**
```json
{
  "id": "cart-item-id",
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 1,
  "product": { ... },
  "variant": { ... }
}
```

**Error Responses:**
- `400`: Invalid quantity, insufficient stock
- `404`: Product or variant not found

#### DELETE /api/cart
Clear the entire cart.

**Response:**
```json
{
  "message": "Cart cleared successfully"
}
```

#### PUT /api/cart/items/:itemId
Update the quantity of a specific cart item.

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "id": "cart-item-id",
  "quantity": 3,
  "product": { ... }
}
```

**Error Responses:**
- `400`: Invalid quantity, insufficient stock
- `403`: Unauthorized (not your cart item)
- `404`: Cart item not found

#### DELETE /api/cart/items/:itemId
Remove a specific item from the cart.

**Response:**
```json
{
  "message": "Item removed from cart"
}
```

**Error Responses:**
- `403`: Unauthorized
- `404`: Cart item not found

#### POST /api/cart/merge
Merge an anonymous cart with the authenticated user's cart. This should be called after user login.

**Request Body:**
```json
{
  "sessionId": "anonymous-session-id"
}
```

**Response:**
```json
{
  "message": "Cart merged successfully",
  "mergedCount": 3,
  "updatedCount": 2,
  "totalItems": 5
}
```

**Notes:**
- Items that exist in both carts will have their quantities combined
- Duplicate items are removed after merging
- Requires authentication

---

## Order Lifecycle API

### Overview
The order lifecycle API provides comprehensive order management with status tracking, audit trails, and event logging.

### Order Statuses
Orders progress through the following states:

1. **pending**: Order created, awaiting payment
2. **paid**: Payment received
3. **confirmed**: Order confirmed by vendor/system
4. **processing**: Order being prepared
5. **fulfilled**: Order fulfilled and ready to ship
6. **shipped**: Order shipped to customer
7. **delivered**: Order delivered to customer
8. **cancelled**: Order cancelled (can happen at most stages)
9. **refunded**: Payment refunded to customer

### Valid Status Transitions
- `pending` → `paid`, `cancelled`
- `paid` → `confirmed`, `cancelled`, `refunded`
- `confirmed` → `processing`, `cancelled`
- `processing` → `fulfilled`, `cancelled`
- `fulfilled` → `shipped`, `cancelled`
- `shipped` → `delivered`, `cancelled`
- `delivered` → `refunded`
- `cancelled` → (terminal state)
- `refunded` → (terminal state)

### Endpoints

#### GET /api/orders/:orderId
Fetch a single order with full details including items and event history.

**Response:**
```json
{
  "id": "order-id",
  "orderNumber": "ORD-12345",
  "status": "processing",
  "paymentStatus": "completed",
  "subtotal": 100,
  "totalAmount": 115,
  "createdAt": "2024-01-01T00:00:00Z",
  "paidAt": "2024-01-01T00:05:00Z",
  "confirmedAt": "2024-01-01T00:10:00Z",
  "processingAt": "2024-01-01T01:00:00Z",
  "orderItems": [
    {
      "id": "item-id",
      "productName": "Product Name",
      "quantity": 2,
      "price": 50,
      "total": 100,
      "vendor": {
        "displayName": "Vendor Name"
      }
    }
  ],
  "orderEvents": [
    {
      "id": "event-id",
      "eventType": "status_changed",
      "status": "processing",
      "description": "Order status changed to processing",
      "createdAt": "2024-01-01T01:00:00Z",
      "metadata": {
        "previousStatus": "confirmed",
        "newStatus": "processing"
      }
    }
  ]
}
```

**Authorization:**
- Users can only view their own orders
- Admins can view all orders

#### PUT /api/orders/:orderId/status
Update the order status. Validates status transitions and creates audit trail.

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Order shipped via DHL tracking: ABC123"
}
```

**Response:**
```json
{
  "id": "order-id",
  "status": "shipped",
  "shippedAt": "2024-01-01T02:00:00Z",
  "orderItems": [ ... ]
}
```

**Error Responses:**
- `400`: Invalid status or invalid transition
- `401`: Unauthorized
- `403`: Forbidden (not your order)
- `404`: Order not found

**Features:**
- Validates status transitions
- Automatically updates timestamp fields (paidAt, shippedAt, etc.)
- Creates order event in audit trail
- Requires authentication

#### GET /api/orders/:orderId/events
Fetch the audit trail of events for an order.

**Response:**
```json
[
  {
    "id": "event-id",
    "orderId": "order-id",
    "eventType": "status_changed",
    "status": "shipped",
    "description": "Order shipped via DHL",
    "metadata": {
      "previousStatus": "fulfilled",
      "newStatus": "shipped",
      "changedBy": "user-id",
      "trackingNumber": "ABC123"
    },
    "createdAt": "2024-01-01T02:00:00Z"
  }
]
```

**Authorization:**
- Users can only view events for their own orders
- Admins can view all order events

#### POST /api/orders/:orderId/events
Add a custom event to the order (e.g., fulfillment notes, shipping updates).

**Request Body:**
```json
{
  "eventType": "fulfillment_note",
  "description": "Package handed to courier",
  "metadata": {
    "courierName": "DHL",
    "trackingNumber": "ABC123"
  }
}
```

**Response:**
```json
{
  "id": "event-id",
  "orderId": "order-id",
  "eventType": "fulfillment_note",
  "status": "shipped",
  "description": "Package handed to courier",
  "metadata": {
    "courierName": "DHL",
    "trackingNumber": "ABC123",
    "createdBy": "user-id",
    "createdByEmail": "user@example.com"
  },
  "createdAt": "2024-01-01T02:05:00Z"
}
```

**Authorization:**
- Users can add events to their own orders
- Admins can add events to any order

---

## Usage Examples

### Cart Flow for Anonymous User

```javascript
// 1. Generate session ID
const sessionId = crypto.randomUUID();
localStorage.setItem('sessionId', sessionId);

// 2. Add items to cart
await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  },
  body: JSON.stringify({
    productId: 'prod-123',
    quantity: 2
  })
});

// 3. Fetch cart
const cart = await fetch('/api/cart', {
  headers: { 'x-session-id': sessionId }
}).then(r => r.json());
```

### Cart Merge on Login

```javascript
// After successful login
const sessionId = localStorage.getItem('sessionId');
const token = getAuthToken();

await fetch('/api/cart/merge', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sessionId })
});

// Clear session ID after merge
localStorage.removeItem('sessionId');
```

### Order Status Update

```javascript
// Update order status (admin or vendor)
await fetch(`/api/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'shipped',
    notes: 'Shipped via DHL, tracking: ABC123'
  })
});
```

### Add Fulfillment Event

```javascript
// Add custom event
await fetch(`/api/orders/${orderId}/events`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventType: 'package_scanned',
    description: 'Package scanned at distribution center',
    metadata: {
      location: 'Addis Ababa DC',
      scanTime: new Date().toISOString()
    }
  })
});
```

---

## Database Schema

### OrderEvent Model
```prisma
model OrderEvent {
  id          String      @id @default(dbgenerated("gen_random_uuid()"))
  orderId     String      @map("order_id")
  eventType   String      @map("event_type")
  status      OrderStatus?
  description String?
  metadata    Json?
  createdAt   DateTime    @default(now())
  
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

### Order Audit Timestamps
The Order model includes timestamp fields for each status:
- `paidAt`: When payment was received
- `confirmedAt`: When order was confirmed
- `processingAt`: When processing started
- `fulfilledAt`: When order was fulfilled
- `shippedAt`: When order was shipped
- `deliveredAt`: When order was delivered
- `cancelledAt`: When order was cancelled
- `refundedAt`: When refund was processed

---

## Security Considerations

1. **Authorization**: All order endpoints verify user ownership or admin status
2. **Stock Validation**: Cart operations validate product/variant stock availability
3. **Session Management**: Anonymous sessions are tracked but not stored in user table
4. **Audit Trail**: All order status changes are logged with user information
5. **Input Validation**: All inputs are validated before processing

---

## Error Handling

All endpoints follow consistent error response format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid input)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error
