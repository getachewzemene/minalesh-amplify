# Vendor Commission & Payout System

## Overview

The vendor commission system tracks sales, calculates commissions, and manages vendor payouts. The system includes:

1. **Per-vendor commission rates** - Each vendor can have a custom commission rate
2. **Automatic ledger entries** - Commission entries are created when orders are paid
3. **Month-end commission calculation** - Accurate totals for each vendor per month
4. **Manual payout recording** - Admins can record payouts to vendors

## Database Schema

### Profile Model (Vendor Information)

```prisma
model Profile {
  // ... other fields
  commissionRate Decimal? @default(0.15) @map("commission_rate") @db.Decimal(5, 4)
}
```

- `commissionRate`: Vendor's commission rate (default: 0.15 = 15%)
- Range: 0.0000 to 1.0000 (0% to 100%)

### CommissionLedger Model

```prisma
model CommissionLedger {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId         String   @map("vendor_id") @db.Uuid
  orderId          String   @map("order_id") @db.Uuid
  orderItemId      String?  @map("order_item_id") @db.Uuid
  saleAmount       Decimal  @map("sale_amount") @db.Decimal(10, 2)
  commissionRate   Decimal  @map("commission_rate") @db.Decimal(5, 4)
  commissionAmount Decimal  @map("commission_amount") @db.Decimal(10, 2)
  vendorPayout     Decimal  @map("vendor_payout") @db.Decimal(10, 2)
  status           String   @default("pending")
  paidAt           DateTime? @map("paid_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
}
```

Each ledger entry represents a commission calculation for an order item.

## Commission Calculation

### Formula

```
Commission Amount = Sale Amount × Commission Rate
Vendor Payout = Sale Amount - Commission Amount
```

### Example

For a vendor with 15% commission rate and $1,000 in sales:

```
Commission Amount = $1,000 × 0.15 = $150
Vendor Payout = $1,000 - $150 = $850
```

## API Endpoints

### 1. Get Vendor Ledger

```http
GET /api/vendors/ledger?vendorId={uuid}&startDate={iso}&endDate={iso}&status={status}&limit={n}&offset={n}
Authorization: Bearer {token}
```

**Query Parameters:**
- `vendorId` (required for admin): Vendor UUID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `status` (optional): Entry status
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "id": "uuid",
      "vendorId": "uuid",
      "orderId": "uuid",
      "saleAmount": 1000.00,
      "commissionRate": 0.15,
      "commissionAmount": 150.00,
      "vendorPayout": 850.00,
      "status": "recorded",
      "paidAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100
  }
}
```

### 2. Calculate Month-End Commission

```http
GET /api/vendors/commission?vendorId={uuid}&year={yyyy}&month={mm}
Authorization: Bearer {admin-token}
```

**Query Parameters:**
- `vendorId` (required): Vendor UUID
- `year` (required): Year (e.g., 2024)
- `month` (required): Month (1-12)

**Response:**
```json
{
  "success": true,
  "commission": {
    "vendorId": "uuid",
    "period": {
      "year": 2024,
      "month": 1,
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "totalSales": 10000.00,
    "totalCommission": 1500.00,
    "totalPayout": 8500.00,
    "entryCount": 50,
    "averageRate": 0.15
  }
}
```

**Acceptance Criteria:** Month-end commission totals are accurate within 0.01 ETB.

### 3. Update Vendor Commission Rate

```http
PATCH /api/vendors/commission
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "vendorId": "uuid",
  "commissionRate": 0.20
}
```

**Response:**
```json
{
  "success": true,
  "vendor": {
    "id": "uuid",
    "displayName": "Vendor Name",
    "commissionRate": 0.20
  }
}
```

### 4. Existing Payout Endpoints

**Calculate and Create Payout:**
```http
POST /api/vendors/payouts
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "vendorId": "uuid",
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z",
  "commissionRate": 0.15
}
```

**Get Vendor Payouts:**
```http
GET /api/vendors/payouts?vendorId={uuid}
Authorization: Bearer {token}
```

**Mark Payout as Paid:**
```http
PATCH /api/vendors/payouts
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "payoutId": "uuid"
}
```

## Automatic Ledger Creation

Commission ledger entries are automatically created when orders are paid through the payment webhook:

```typescript
// In payment webhook when status === 'completed'
const entriesCreated = await createCommissionLedgerEntries(order.id);
```

This ensures:
1. Every paid order generates commission entries
2. Each order item is tracked separately
3. Vendor-specific commission rates are applied
4. Idempotency (no duplicate entries)

## Month-End Process

### Automated Monthly Payout Calculation

The system can automatically calculate payouts for all vendors at month-end:

```typescript
import { scheduleMonthlyPayouts } from '@/lib/vendor-payout';

// Run as cron job at end of each month
const payoutsCreated = await scheduleMonthlyPayouts();
```

This function:
1. Gets all approved vendors
2. Calculates payouts for previous month
3. Creates payout records
4. Generates vendor statements
5. Avoids duplicate payouts

### Manual Calculation

Admins can manually calculate commissions for any period using:
```http
GET /api/vendors/commission?vendorId={uuid}&year={yyyy}&month={mm}
```

## Security & Access Control

### Admin Only:
- Calculate month-end commissions
- Update vendor commission rates
- View all vendor ledgers
- Create and manage payouts

### Vendor Access:
- View own ledger entries
- View own payout summary
- Cannot modify commission rates
- Cannot create payouts

## Testing

Run vendor commission tests:
```bash
npm test -- src/lib/vendor-payout.test.ts
```

Test coverage includes:
- Commission calculation accuracy
- Month-end total accuracy
- Mixed commission rate handling
- Ledger entry structure validation
- Order total formula verification

## Integration Example

### For Admin Dashboard

```typescript
// Get month-end commission for a vendor
const commission = await fetch('/api/vendors/commission?vendorId=xxx&year=2024&month=1', {
  headers: { Authorization: `Bearer ${adminToken}` }
});

// Display commission summary
console.log(`Total Sales: ${commission.totalSales} ETB`);
console.log(`Commission: ${commission.totalCommission} ETB`);
console.log(`Payout: ${commission.totalPayout} ETB`);
```

### For Vendor Dashboard

```typescript
// Get vendor's ledger
const ledger = await fetch('/api/vendors/ledger?limit=50', {
  headers: { Authorization: `Bearer ${vendorToken}` }
});

// Display ledger entries
ledger.entries.forEach(entry => {
  console.log(`Order: ${entry.orderId}`);
  console.log(`Sale: ${entry.saleAmount} ETB`);
  console.log(`Commission: ${entry.commissionAmount} ETB`);
  console.log(`Payout: ${entry.vendorPayout} ETB`);
});
```

## Migration

To apply the database changes:

```bash
# Run migration
npx prisma migrate deploy

# Or in development
npx prisma migrate dev
```

The migration adds:
1. `commission_rate` column to `profiles` table
2. `commission_ledger` table with indexes

## Future Enhancements

- [ ] Export ledger to CSV/PDF
- [ ] Automatic email notifications to vendors
- [ ] Commission rate change history
- [ ] Bulk payout processing
- [ ] Tax withholding support
- [ ] Multi-currency support
