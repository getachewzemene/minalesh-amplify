# Advanced E-commerce Features Documentation

This document describes the advanced features implemented in the Minalesh marketplace platform, including inventory management, refunds, vendor payouts, and invoicing.

## Table of Contents

1. [Inventory Reservations](#inventory-reservations)
2. [Payment Webhooks](#payment-webhooks)
3. [Refunds & Partial Captures](#refunds--partial-captures)
4. [Multi-vendor Commission & Payouts](#multi-vendor-commission--payouts)
5. [Invoices & Receipts](#invoices--receipts)

---

## Inventory Reservations

### Overview

The inventory reservation system prevents overselling by temporarily reserving stock during the checkout process. Reservations automatically expire after a configurable timeout period.

### Key Features

- **Race Condition Protection**: Uses database transactions to prevent concurrent reservations exceeding available stock
- **Automatic Expiration**: Reservations expire after 15 minutes by default
- **Oversell Prevention**: Available stock calculations include active reservations
- **Transactional Stock Decrement**: Stock is only decremented when payment is confirmed

### API Endpoints

#### Create Reservation

```http
POST /api/inventory/reserve
Content-Type: application/json
Authorization: Bearer {token}

{
  "productId": "uuid",
  "variantId": "uuid", // optional
  "quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "reservationId": "uuid",
  "availableStock": 45
}
```

#### Check Available Stock

```http
GET /api/inventory/reserve?productId={uuid}&variantId={uuid}
```

**Response:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "availableStock": 45
}
```

#### Release Reservation

```http
DELETE /api/inventory/reserve?reservationId={uuid}
```

### Usage Flow

1. **Checkout Initiation**: Create reservation when user starts checkout
2. **Hold Period**: Reservation held for 15 minutes
3. **Payment Success**: Call `commitReservation()` to decrement stock
4. **Payment Failure/Timeout**: Reservation automatically expires and stock is released

### Code Example

```typescript
import { createReservation, commitReservation } from '@/lib/inventory';

// On checkout start
const reservation = await createReservation({
  productId: 'prod-123',
  quantity: 2,
  userId: 'user-456',
});

// On payment success
if (reservation.reservationId) {
  await commitReservation(reservation.reservationId, orderId);
}
```

### Maintenance

Run the cleanup function periodically (recommended: every 5 minutes):

```typescript
import { cleanupExpiredReservations } from '@/lib/inventory';

// In a cron job
const cleaned = await cleanupExpiredReservations();
console.log(`Cleaned ${cleaned} expired reservations`);
```

---

## Payment Webhooks

### Overview

The payment webhook system securely receives payment notifications from payment providers and updates order status accordingly.

### Security Features

- **Signature Verification**: HMAC SHA256 signature validation
- **Provider-Specific Secrets**: Support for multiple payment providers
- **Idempotency**: Prevents duplicate processing of the same webhook event
- **Timing-Safe Comparison**: Prevents timing attacks

### Webhook Endpoint

```http
POST /api/payments/webhook
Content-Type: application/json
X-Webhook-Signature: {hmac-sha256-signature}

{
  "provider": "TeleBirr",
  "status": "completed",
  "orderId": "uuid",
  "orderNumber": "MIN-1234567890",
  "paymentReference": "PAY-REF-123",
  "amount": "1500.00",
  "meta": {
    "eventId": "evt-123"
  }
}
```

### Supported Providers

- **TeleBirr**: Ethiopian mobile payment
- **CBE Birr**: Commercial Bank of Ethiopia
- **Awash Bank**: Awash Bank payments
- **Generic**: Fallback for other providers

### Configuration

Set these environment variables:

```bash
# Required
PAYMENT_WEBHOOK_SECRET=your-secret-key

# Optional provider-specific secrets
TELEBIRR_WEBHOOK_SECRET=telebirr-secret
CBE_WEBHOOK_SECRET=cbe-secret
AWASH_WEBHOOK_SECRET=awash-secret
```

### Idempotency

The system prevents duplicate processing using:

1. **Event ID**: Unique identifier per webhook event
2. **Webhook Events Table**: Stores all received webhooks
3. **Status Tracking**: Prevents reprocessing of completed events

### Retry Logic

Webhooks can be retried if processing fails:

- Failed webhooks are tracked with error messages
- Retry count and next retry time are recorded
- Manual replay available through webhook events table

---

## Refunds & Partial Captures

### Overview

Comprehensive refund management system supporting full and partial refunds with automatic stock restoration.

### Features

- **Full Refunds**: Refund entire order amount
- **Partial Refunds**: Refund portion of order amount
- **Stock Restoration**: Optionally restore refunded items to inventory
- **Provider Integration**: Ready for payment provider API integration
- **Refund Tracking**: Complete audit trail of all refunds

### API Endpoints

#### Initiate Refund

```http
POST /api/refunds
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "uuid",
  "amount": 500.00,
  "reason": "Customer requested refund",
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

#### Get Order Refunds

```http
GET /api/refunds?orderId={uuid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "refunds": [
    {
      "id": "uuid",
      "amount": 500.00,
      "status": "completed",
      "reason": "Customer requested refund",
      "createdAt": "2024-01-01T12:00:00Z",
      "processedAt": "2024-01-01T12:05:00Z"
    }
  ],
  "refundableAmount": 1000.00
}
```

### Refund Statuses

- `pending`: Refund initiated, awaiting processing
- `completed`: Refund successfully processed
- `failed`: Refund processing failed

### Provider Integration

The `processRefund()` function includes placeholders for provider-specific refund logic:

```typescript
// In production, implement actual provider APIs
switch (provider) {
  case 'telebirr':
    // Call TeleBirr refund API
    break;
  case 'cbe':
    // Call CBE refund API
    break;
  // etc.
}
```

---

## Multi-vendor Commission & Payouts

### Overview

Automated commission calculation and payout management for marketplace vendors.

### Features

- **Automatic Calculation**: Calculate sales and commissions for any period
- **Configurable Commission**: Default 15%, customizable per vendor
- **Statement Generation**: Detailed statements for transparency
- **Payout Scheduling**: Monthly automated payout generation
- **Vendor Dashboard**: Summary of earnings and payouts

### API Endpoints

#### Calculate Vendor Payout (Admin Only)

```http
POST /api/vendors/payouts
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "vendorId": "uuid",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z",
  "commissionRate": 0.15
}
```

**Response:**
```json
{
  "success": true,
  "payoutId": "uuid",
  "calculation": {
    "totalSales": 10000.00,
    "commissionRate": 0.15,
    "commissionAmount": 1500.00,
    "payoutAmount": 8500.00,
    "orderCount": 25
  }
}
```

#### Get Vendor Payouts

```http
GET /api/vendors/payouts
Authorization: Bearer {token}
```

**Response:**
```json
{
  "totalEarnings": 50000.00,
  "pendingPayouts": [...],
  "paidPayouts": [...],
  "recentStatements": [...]
}
```

#### Mark Payout as Paid (Admin Only)

```http
PATCH /api/vendors/payouts
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "payoutId": "uuid"
}
```

### Commission Calculation

The system calculates commissions based on:

- **Completed Orders**: Only `delivered` or `completed` orders
- **Delivery Date**: Orders delivered within the period
- **Total Sales**: Sum of all order item totals for vendor
- **Commission**: `totalSales * commissionRate`
- **Payout**: `totalSales - commission`

### Automated Monthly Payouts

Schedule the `scheduleMonthlyPayouts()` function as a cron job:

```typescript
import { scheduleMonthlyPayouts } from '@/lib/vendor-payout';

// Run on the 1st of each month
const created = await scheduleMonthlyPayouts();
console.log(`Created ${created} payouts`);
```

This will:
1. Find all approved vendors
2. Calculate sales for previous month
3. Create payout records
4. Generate statements

---

## Invoices & Receipts

### Overview

Professional invoice generation with Ethiopian tax compliance, sequential numbering, and HTML templates ready for PDF conversion.

### Features

- **Sequential Numbering**: Format: `INV-YYYYMM-XXXX`
- **Ethiopian Compliance**: Includes TIN and Trade License
- **VAT Calculation**: 15% Ethiopian VAT
- **HTML Templates**: Professional invoice layout
- **Order Integration**: One invoice per order
- **Email Ready**: Track email delivery status

### API Endpoints

#### Create Invoice

```http
POST /api/invoices
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "uuid",
  "notes": "Thank you for your purchase"
}
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "uuid",
  "invoiceNumber": "INV-202401-0001"
}
```

#### Get Invoice

```http
GET /api/invoices?invoiceId={uuid}
Authorization: Bearer {token}
```

**Get HTML Version:**
```http
GET /api/invoices?invoiceId={uuid}&format=html
Authorization: Bearer {token}
```

Returns HTML document ready for:
- Direct display
- PDF generation (using Puppeteer, wkhtmltopdf, etc.)
- Email delivery

#### Get Invoice by Order

```http
GET /api/invoices?orderId={uuid}
Authorization: Bearer {token}
```

### Invoice Structure

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;  // INV-202401-0001
  issueDate: Date;
  subtotal: Decimal;
  taxAmount: Decimal;     // 15% VAT
  discountAmount: Decimal;
  shippingAmount: Decimal;
  totalAmount: Decimal;
  currency: string;       // ETB
  status: string;         // draft, paid
  tinNumber: string;      // Vendor TIN
  tradeLicense: string;   // Vendor Trade License
  paidAt: Date | null;
  emailSentAt: Date | null;
}
```

### PDF Generation

To generate PDFs, integrate with a library like Puppeteer:

```typescript
import puppeteer from 'puppeteer';
import { getInvoice, generateInvoiceHTML, updateInvoicePdfUrl } from '@/lib/invoice';

async function generateInvoicePDF(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  const html = generateInvoiceHTML(invoice);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });
  await browser.close();
  
  // Upload PDF to storage
  const pdfUrl = await uploadToS3(pdf);
  await updateInvoicePdfUrl(invoiceId, pdfUrl);
  
  return pdfUrl;
}
```

### Email Delivery

```typescript
import { getInvoice, generateInvoiceHTML, markInvoiceAsSent } from '@/lib/invoice';

async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  const html = generateInvoiceHTML(invoice);
  
  await sendEmail({
    to: invoice.order.user.email,
    subject: `Invoice ${invoice.invoiceNumber}`,
    html: html,
  });
  
  await markInvoiceAsSent(invoiceId);
}
```

---

## Database Migration

Before using these features, run the database migration:

```bash
npx prisma migrate dev --name add_advanced_features
npx prisma generate
```

This will create the following tables:
- `inventory_reservations`
- `refunds`
- `invoices`
- `vendor_statements`

---

## Security Considerations

### Inventory Reservations
- Reservations are user/session-specific
- Expired reservations automatically released
- Transactional operations prevent race conditions

### Refunds
- Only order owners and admins can initiate refunds
- Partial refunds limited to remaining order total
- Stock restoration is optional and configurable

### Vendor Payouts
- Only admins can calculate and mark payouts as paid
- Vendors can only view their own payout information
- Commission rates validated to be between 0 and 1

### Invoices
- Only order owners and admins can view invoices
- Invoice numbers are sequential and immutable
- Compliance data (TIN, Trade License) included automatically

---

## Best Practices

1. **Inventory Reservations**
   - Run cleanup job every 5 minutes
   - Set appropriate timeout based on your checkout flow
   - Monitor reservation expiration rates

2. **Webhooks**
   - Always verify signatures
   - Use provider-specific secrets
   - Log all webhook events
   - Implement retry logic for failed webhooks

3. **Refunds**
   - Verify refund amount before processing
   - Restore stock for physical products
   - Send notification emails to customers

4. **Vendor Payouts**
   - Run monthly payout generation automatically
   - Send statement emails to vendors
   - Verify bank details before processing payouts

5. **Invoices**
   - Generate invoice immediately after order completion
   - Send invoice emails automatically
   - Store PDFs in secure, backed-up storage

---

## Testing

All features include comprehensive unit tests. Run tests with:

```bash
npm test
```

Test coverage includes:
- Inventory reservation logic (13 tests)
- Race condition scenarios
- Refund calculations
- Commission calculations
- Invoice generation

---

## Support

For questions or issues with these features:

1. Check the API endpoint documentation above
2. Review the source code in `/src/lib/`
3. Run the test suite to verify your environment
4. Contact the development team

---

## Future Enhancements

Planned improvements:
- [ ] Real-time reservation notifications
- [ ] Automated PDF generation service
- [ ] Email templates for invoices and statements
- [ ] Vendor payout dashboard UI
- [ ] Refund analytics and reporting
- [ ] Multi-currency support
- [ ] Batch refund processing
- [ ] Advanced commission rules (tiered, category-based)

---

**Last Updated**: November 2024  
**Version**: 1.0.0
