# Advanced Analytics & Low Stock Alerts

## Overview

The platform includes comprehensive analytics endpoints for sales tracking, product performance, and inventory management. All analytics endpoints require admin authentication.

## Sales Analytics

### Endpoint

```http
GET /api/analytics/sales?startDate={iso}&endDate={iso}&groupBy={day|week|month}
Authorization: Bearer {admin-token}
```

### Query Parameters

- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)
- `groupBy` (optional): 'day', 'week', or 'month' (default: 'day')

### Response

```json
{
  "totalRevenue": 150000.00,
  "totalOrders": 250,
  "averageOrderValue": 600.00,
  "uniqueUsers": 180,
  "trends": [
    {
      "date": "2024-01-15",
      "revenue": 5000.00,
      "orders": 10,
      "users": 8
    }
  ],
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "groupBy": "day"
  }
}
```

### Features

- **Accurate daily/weekly/monthly grouping**
- **Excludes cancelled and refunded orders**
- **Tracks unique users per period**
- **Revenue trends over time**

### Accuracy

The sales analytics endpoint uses Prisma aggregations and manual calculations to ensure accuracy:

```typescript
// Total stats using aggregate
const orderStats = await prisma.order.aggregate({
  where: { status: { notIn: ['cancelled', 'refunded'] } },
  _sum: { totalAmount: true },
  _count: { id: true },
  _avg: { totalAmount: true },
});
```

**Acceptance Criteria:** Dashboard metrics match manual SQL within 1% tolerance.

## Product Performance Analytics

### Endpoint

```http
GET /api/analytics/products?startDate={iso}&endDate={iso}&limit={n}
Authorization: Bearer {admin-token}
```

### Query Parameters

- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)
- `limit` (optional): Number of top products (default: 10)

### Response

```json
{
  "topProducts": [
    {
      "rank": 1,
      "id": "uuid",
      "name": "Ethiopian Coffee - Yirgacheffe",
      "revenue": 25000.00,
      "unitsSold": 500,
      "categoryName": "Coffee"
    }
  ],
  "categoryBreakdown": [
    {
      "name": "Coffee",
      "revenue": 50000.00,
      "orders": 1000,
      "percentage": 33.33
    }
  ],
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

### Features

- **Top-selling products by revenue**
- **Category breakdown with percentages**
- **Unit sales tracking**
- **Customizable time periods**

## Low Stock Alerts

### Analytics Endpoint

```http
GET /api/analytics/low-stock?threshold={n}&limit={n}&offset={n}
Authorization: Bearer {admin-token}
```

### Query Parameters

- `threshold` (optional): Stock threshold (default: use product's lowStockThreshold)
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

### Response

```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "SKU-123",
      "stockQuantity": 2,
      "lowStockThreshold": 5,
      "price": 100.00,
      "status": "low_stock",
      "vendor": {
        "id": "uuid",
        "displayName": "Vendor Name"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 15,
  "criticalCount": 3,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 15
  }
}
```

### Stock Status Levels

- `out_of_stock`: Stock quantity ≤ 0
- `low_stock`: 0 < Stock quantity ≤ Low stock threshold
- `in_stock`: Stock quantity > Low stock threshold

### Features

- **Customizable threshold per product**
- **Critical stock alerts (out of stock)**
- **Vendor information included**
- **Pagination support**
- **Active products only**

## Automated Low Stock Alerts (Cron Job)

### Endpoint

```http
GET /api/cron/low-stock-alert
Authorization: Bearer {cron-secret}
# or
x-cron-secret: {cron-secret}
```

This endpoint should be scheduled to run daily via:
- Vercel Cron
- GitHub Actions
- AWS CloudWatch Events
- External cron service

### Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/low-stock-alert",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Or GitHub Actions (`.github/workflows/cron-low-stock.yml`):

```yaml
name: Low Stock Alerts
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC

jobs:
  alert:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger low stock alert
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/low-stock-alert" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

### Functionality

The cron job:
1. **Identifies all low stock products**
2. **Groups products by vendor**
3. **Sends email alerts to each vendor** with their low stock items
4. **Sends summary email to admins** with overall statistics
5. **Returns execution summary**

### Response

```json
{
  "success": true,
  "message": "Low stock alerts sent",
  "productsFound": 15,
  "vendorsNotified": 8,
  "criticalCount": 3
}
```

### Email Notifications

**To Vendors:**
- Subject: "Low Stock Alert: {count} Products Need Attention"
- Lists all low stock and out-of-stock items
- Includes product names, SKUs, and current quantities

**To Admins:**
- Subject: "Low Stock Summary: {count} Products Need Attention"
- Overall statistics
- Vendor count affected
- Critical items count

### Environment Variables

```bash
# In .env
CRON_SECRET="your-secure-cron-secret"
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
```

## Analytics Accuracy Guarantee

### Testing Methodology

All analytics calculations are tested against manual SQL queries to ensure accuracy within 1% tolerance:

```typescript
const calculateTolerance = (expected: number, actual: number) => {
  return Math.abs((actual - expected) / expected) * 100;
};

// Example: tolerance should be < 1%
const tolerance = calculateTolerance(manualSQLResult, dashboardResult);
expect(tolerance).toBeLessThan(1);
```

### SQL Validation Examples

**Total Revenue:**
```sql
SELECT SUM(total_amount) as total_revenue
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
  AND created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

**Top Products:**
```sql
SELECT 
  p.id,
  p.name,
  SUM(oi.total) as revenue,
  SUM(oi.quantity) as units_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.status NOT IN ('cancelled', 'refunded')
  AND o.created_at BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 10;
```

**Low Stock Count:**
```sql
SELECT COUNT(*) 
FROM products 
WHERE stock_quantity <= low_stock_threshold 
  AND is_active = true;
```

## Testing

Run analytics tests:
```bash
npm test -- src/lib/analytics.test.ts
```

Test coverage includes:
- Revenue calculation accuracy
- Average order value calculation
- Unique user counting
- Product ranking by revenue
- Category percentage calculation
- Date grouping correctness
- Low stock identification
- 1% tolerance verification

## Integration Examples

### Admin Dashboard - Sales Chart

```typescript
const response = await fetch(
  '/api/analytics/sales?startDate=2024-01-01&endDate=2024-01-31&groupBy=day',
  {
    headers: { Authorization: `Bearer ${adminToken}` }
  }
);

const data = await response.json();

// Use with charting library (e.g., recharts)
<LineChart data={data.trends}>
  <Line dataKey="revenue" />
  <Line dataKey="orders" />
</LineChart>
```

### Low Stock Dashboard Widget

```typescript
const response = await fetch('/api/analytics/low-stock?limit=10', {
  headers: { Authorization: `Bearer ${adminToken}` }
});

const { products, criticalCount } = await response.json();

// Display alert badge
if (criticalCount > 0) {
  showAlert(`${criticalCount} products out of stock!`);
}
```

### Vendor Dashboard - Performance

```typescript
const response = await fetch(
  '/api/analytics/products?startDate=2024-01-01&limit=5',
  {
    headers: { Authorization: `Bearer ${adminToken}` }
  }
);

const { topProducts } = await response.json();

// Display top sellers
topProducts.forEach(product => {
  console.log(`${product.rank}. ${product.name}: ${product.revenue} ETB`);
});
```

## Performance Considerations

### Caching

Analytics endpoints support caching headers:

```typescript
// In-memory cache with 5-minute TTL
const cacheKey = `analytics:sales:${startDate}:${endDate}`;
const cached = await getFromCache(cacheKey);

if (cached) {
  return cached;
}

const result = await calculateSales(...);
await setInCache(cacheKey, result, 300); // 5 minutes
```

### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
-- Orders
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- Order Items
CREATE INDEX idx_order_items_order_vendor ON order_items(order_id, vendor_id);

-- Products
CREATE INDEX idx_products_stock_active ON products(stock_quantity, is_active);
```

## Monitoring

Monitor analytics endpoint performance:

```bash
# Response time
GET /api/analytics/sales
X-Response-Time: 45ms

# Cache hit rate
Cache-Status: HIT
Age: 120
```

## Future Enhancements

- [ ] Real-time analytics with WebSocket updates
- [ ] Export analytics to CSV/PDF
- [ ] Custom date range presets
- [ ] Comparison with previous periods
- [ ] Predictive analytics for stock forecasting
- [ ] Vendor-specific analytics dashboard
- [ ] Geographic sales breakdown
- [ ] Customer cohort analysis
