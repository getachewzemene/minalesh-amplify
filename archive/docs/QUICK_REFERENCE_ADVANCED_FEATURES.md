# Quick Reference: Advanced E-commerce Features

## Quick Start

### 1. Database Setup (Required)
```bash
# Run migration
npx prisma migrate dev --name add_advanced_features

# Generate client
npx prisma generate
```

### 2. Environment Variables (Required)
```env
PAYMENT_WEBHOOK_SECRET=your-strong-secret-key
```

### 3. Test Your Setup
```bash
npm test  # Should pass 73 tests
npm run build  # Should build successfully
```

---

## API Quick Reference

### Inventory Reservations

```bash
# Check available stock
GET /api/inventory/reserve?productId={uuid}

# Create reservation
POST /api/inventory/reserve
{
  "productId": "uuid",
  "quantity": 5
}

# Release reservation
DELETE /api/inventory/reserve?reservationId={uuid}
```

### Refunds

```bash
# Get order refunds
GET /api/refunds?orderId={uuid}
Authorization: Bearer {token}

# Create refund
POST /api/refunds
Authorization: Bearer {token}
{
  "orderId": "uuid",
  "amount": 500.00,
  "reason": "Customer requested",
  "restoreStock": true
}
```

### Vendor Payouts

```bash
# Get vendor payouts (vendor or admin)
GET /api/vendors/payouts
Authorization: Bearer {token}

# Calculate payout (admin only)
POST /api/vendors/payouts
Authorization: Bearer {admin-token}
{
  "vendorId": "uuid",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}

# Mark as paid (admin only)
PATCH /api/vendors/payouts
Authorization: Bearer {admin-token}
{
  "payoutId": "uuid"
}
```

### Invoices

```bash
# Create invoice
POST /api/invoices
Authorization: Bearer {token}
{
  "orderId": "uuid",
  "notes": "Thank you for your purchase"
}

# Get invoice JSON
GET /api/invoices?invoiceId={uuid}
Authorization: Bearer {token}

# Get invoice HTML
GET /api/invoices?invoiceId={uuid}&format=html
Authorization: Bearer {token}

# Get by order
GET /api/invoices?orderId={uuid}
Authorization: Bearer {token}
```

---

## Code Examples

### Reserve Stock During Checkout

```typescript
import { createReservation } from '@/lib/inventory';

async function handleCheckoutStart(cartItems) {
  const reservations = [];
  
  for (const item of cartItems) {
    const result = await createReservation({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      userId: currentUser.id,
    });
    
    if (!result.success) {
      // Handle insufficient stock
      throw new Error(result.error);
    }
    
    reservations.push(result.reservationId);
  }
  
  return reservations;
}
```

### Process Payment Webhook

```typescript
// Webhook is automatically handled by /api/payments/webhook
// Just configure the endpoint URL with your payment provider:
// https://yourdomain.com/api/payments/webhook

// Set header:
// X-Webhook-Signature: {hmac-sha256 of body with your secret}
```

### Initiate Refund

```typescript
import { initiateRefund, processRefund } from '@/lib/refund';

async function refundOrder(orderId: string, amount: number) {
  // Initiate refund
  const result = await initiateRefund({
    orderId,
    amount,
    reason: 'Customer not satisfied',
    restoreStock: true,
  });
  
  if (result.success && result.refundId) {
    // Process with payment provider
    await processRefund(result.refundId);
  }
  
  return result;
}
```

### Generate Monthly Payouts

```typescript
import { scheduleMonthlyPayouts } from '@/lib/vendor-payout';

// Run as cron job on 1st of each month
async function monthlyPayoutJob() {
  const count = await scheduleMonthlyPayouts();
  console.log(`Created ${count} payouts`);
}
```

### Generate Invoice

```typescript
import { createInvoice, generateInvoiceHTML } from '@/lib/invoice';

async function generateOrderInvoice(orderId: string) {
  // Create invoice record
  const result = await createInvoice({
    orderId,
    issueDate: new Date(),
  });
  
  if (result.success && result.invoiceId) {
    // Get invoice with order details
    const invoice = await getInvoice(result.invoiceId);
    
    // Generate HTML for PDF/email
    const html = generateInvoiceHTML(invoice);
    
    // Send email or generate PDF
    await sendInvoiceEmail(html);
  }
}
```

---

## Scheduled Jobs

### 1. Cleanup Expired Reservations (Every 5 minutes)

```typescript
// cron: */5 * * * *
import { cleanupExpiredReservations } from '@/lib/inventory';

export async function cleanupJob() {
  const cleaned = await cleanupExpiredReservations();
  console.log(`Cleaned ${cleaned} expired reservations`);
}
```

### 2. Monthly Vendor Payouts (1st of month)

```typescript
// cron: 0 0 1 * *
import { scheduleMonthlyPayouts } from '@/lib/vendor-payout';

export async function monthlyPayoutJob() {
  const created = await scheduleMonthlyPayouts();
  console.log(`Created ${created} payouts`);
  
  // Send notification emails to vendors
  // Generate PDF statements
}
```

---

## Database Queries

### Get Available Stock

```typescript
import { getAvailableStock } from '@/lib/inventory';

const available = await getAvailableStock(productId, variantId);
console.log(`${available} units available`);
```

### Get Refundable Amount

```typescript
import { getRefundableAmount } from '@/lib/refund';

const amount = await getRefundableAmount(orderId);
console.log(`Can refund up to ${amount} ETB`);
```

### Get Vendor Earnings

```typescript
import { getVendorPayoutSummary } from '@/lib/vendor-payout';

const summary = await getVendorPayoutSummary(vendorId);
console.log(`Total earnings: ${summary.totalEarnings} ETB`);
console.log(`Pending: ${summary.pendingPayouts.length} payouts`);
```

---

## Troubleshooting

### Webhook Not Working

1. Check secret is set: `PAYMENT_WEBHOOK_SECRET`
2. Verify signature header name matches provider
3. Check webhook URL is correct
4. Review webhook event logs in database

```sql
SELECT * FROM webhook_events 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Reservation Issues

1. Check expiration time is appropriate
2. Run cleanup job regularly
3. Monitor reservation counts

```sql
SELECT status, COUNT(*) 
FROM inventory_reservations 
GROUP BY status;
```

### Payout Calculation Issues

1. Verify order status is 'delivered'
2. Check date range includes deliveredAt
3. Confirm commission rate is correct

```sql
SELECT vendor_id, COUNT(*), SUM(total)
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
AND o.delivered_at BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY vendor_id;
```

---

## Common Patterns

### Check Stock Before Adding to Cart

```typescript
const available = await getAvailableStock(productId);
if (quantity > available) {
  return { error: `Only ${available} items available` };
}
```

### Reserve During Checkout

```typescript
const reservation = await createReservation({
  productId,
  quantity,
  userId: currentUser.id,
});

// Store reservationId in session
// If payment succeeds, commit it
// If payment fails or timeout, it auto-expires
```

### Auto-Generate Invoice After Payment

```typescript
// In webhook handler after payment success
if (order.paymentStatus === 'completed') {
  await createInvoice({
    orderId: order.id,
  });
}
```

### Monthly Vendor Reporting

```typescript
// Calculate and send statements
const vendors = await getApprovedVendors();
for (const vendor of vendors) {
  const statement = await generateVendorStatement(
    vendor.id,
    periodStart,
    periodEnd
  );
  await sendStatementEmail(vendor.email, statement);
}
```

---

## Configuration Templates

### Cron Job Configuration (Node-cron)

```typescript
import cron from 'node-cron';
import { cleanupExpiredReservations } from '@/lib/inventory';
import { scheduleMonthlyPayouts } from '@/lib/vendor-payout';

// Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await cleanupExpiredReservations();
});

// 1st of month at midnight
cron.schedule('0 0 1 * *', async () => {
  await scheduleMonthlyPayouts();
});
```

### Webhook Configuration

```typescript
// TeleBirr Webhook
{
  url: 'https://yourdomain.com/api/payments/webhook',
  method: 'POST',
  headers: {
    'X-TeleBirr-Signature': '{hmac-sha256}',
    'Content-Type': 'application/json'
  }
}

// CBE Birr Webhook
{
  url: 'https://yourdomain.com/api/payments/webhook',
  method: 'POST',
  headers: {
    'X-CBE-Signature': '{hmac-sha256}',
    'Content-Type': 'application/json'
  }
}
```

---

## Testing Checklist

- [ ] Test inventory reservation creation
- [ ] Test reservation expiration
- [ ] Test webhook signature verification
- [ ] Test refund with stock restoration
- [ ] Test partial refund
- [ ] Test payout calculation
- [ ] Test invoice generation
- [ ] Test invoice HTML rendering
- [ ] Test authorization (owner/admin)
- [ ] Test concurrent stock updates
- [ ] Test amount validation
- [ ] Test error handling

---

## Monitoring Queries

```sql
-- Active reservations
SELECT COUNT(*) FROM inventory_reservations 
WHERE status = 'active' AND expires_at > NOW();

-- Pending refunds
SELECT COUNT(*) FROM refunds WHERE status = 'pending';

-- Pending payouts
SELECT COUNT(*) FROM vendor_payouts WHERE status = 'pending';

-- Invoices without PDF
SELECT COUNT(*) FROM invoices WHERE pdf_url IS NULL;

-- Recent webhook errors
SELECT * FROM webhook_events 
WHERE status = 'error' 
AND created_at > NOW() - INTERVAL '1 day';
```

---

## Support

For detailed documentation, see:
- [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) - Complete guide
- [IMPLEMENTATION_SUMMARY_ADVANCED_FEATURES.md](IMPLEMENTATION_SUMMARY_ADVANCED_FEATURES.md) - Technical details

For issues or questions, check the logs and database first, then consult the full documentation.
