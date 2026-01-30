# Advanced Admin Dashboard Features

## Overview

This document describes the advanced features added to the admin dashboard to provide a professional and production-ready e-commerce system comparable to platforms like Amazon, Alibaba, and eBay.

## Features

### 1. Real-time Dashboard with Live Updates

**Endpoint:** `GET /api/admin/dashboard/live-stats`

**Description:** Provides real-time statistics and metrics for the admin dashboard with auto-refresh capabilities.

**Features:**
- Today's orders, revenue, new users, and vendors
- Active users in the last 24 hours
- Pending orders and vendor verifications
- Low stock product alerts
- Weekly growth percentage
- Recent activity feed (last 10 orders)

**Response Example:**
```json
{
  "success": true,
  "timestamp": "2024-12-24T12:00:00Z",
  "stats": {
    "today": {
      "orders": 45,
      "revenue": 125000,
      "newUsers": 23,
      "newVendors": 2
    },
    "last24Hours": {
      "activeUsers": 342
    },
    "pending": {
      "orders": 12,
      "vendorVerifications": 5
    },
    "alerts": {
      "lowStockProducts": 8
    },
    "growth": {
      "ordersWeekly": "12.5"
    }
  },
  "recentActivity": [...]
}
```

### 2. Admin Notification Center

**Endpoint:** `GET /api/admin/notifications`

**Description:** Intelligent notification system that alerts admins about important events and potential issues.

**Notification Types:**
- **Low Stock Alerts** - Products with less than 10 items in stock
- **Pending Orders** - Orders pending for more than 24 hours
- **Vendor Verifications** - Vendors awaiting approval
- **Suspicious Orders** - High-value orders from new customers (potential fraud)
- **Failed Payments** - High payment failure rate (>5 in 24 hours)

**Response Example:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "low-stock-uuid",
      "type": "warning",
      "category": "inventory",
      "title": "Low Stock Alert",
      "message": "iPhone 15 Pro Max has only 5 items left",
      "metadata": {
        "productId": "uuid",
        "productName": "iPhone 15 Pro Max",
        "stock": 5,
        "vendor": "Tech Store ET"
      },
      "timestamp": "2024-12-24T12:00:00Z",
      "actionUrl": "/admin/dashboard?tab=products&productId=uuid"
    }
  ],
  "summary": {
    "total": 15,
    "alerts": 2,
    "warnings": 8,
    "info": 5
  }
}
```

### 3. Bulk Operations

**Endpoint:** `POST /api/admin/bulk-operations`

**Description:** Perform bulk actions on multiple entities at once for efficient management.

**Supported Operations:**

#### Orders
- `update_status` - Update status of multiple orders
- `cancel` - Cancel multiple orders
- `export` - Export order data

#### Products
- `activate` - Activate multiple products
- `deactivate` - Deactivate multiple products
- `update_price` - Adjust prices (percentage or fixed amount)
- `delete` - Delete multiple products
- `export` - Export product data

#### Users
- `suspend` - Suspend multiple users
- `activate` - Activate multiple users
- `export` - Export user data

**Request Example:**
```json
{
  "operation": "update_status",
  "entityType": "orders",
  "entityIds": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "status": "shipped"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "operation": "update_status",
  "updated": 3,
  "status": "shipped"
}
```

### 4. Comprehensive Reporting

**Endpoint:** `GET /api/admin/reports`

**Description:** Generate detailed reports in JSON or CSV format for various business metrics.

**Report Types:**

#### Sales Report
- Total orders, revenue, items sold
- Average order value
- Top 10 selling products
- Sales breakdown by day

#### Inventory Report
- Total products and stock value
- Low stock and out-of-stock products
- Category breakdown
- Stock status summary

#### Customer Report
- Total customers
- Active vs inactive customers
- Customer lifetime value
- Average lifetime value

#### Vendor Report
- Total vendors
- Approved vs pending vendors
- Product count per vendor
- Vendor activity summary

#### Financial Report
- Total revenue and refunds
- Net revenue
- Tax collected
- Shipping revenue

**Query Parameters:**
- `type` - Report type (sales, inventory, customers, vendors, financial)
- `startDate` - Start date for report (ISO 8601 format)
- `endDate` - End date for report (ISO 8601 format)
- `format` - Response format (json or csv)

**Example:**
```bash
GET /api/admin/reports?type=sales&startDate=2024-12-01&endDate=2024-12-31&format=csv
```

### 5. Customer Relationship Management (CRM)

**Endpoint:** `GET /api/admin/crm`

**Description:** Advanced customer segmentation and lifetime value tracking.

**Customer Segments:**
- **VIP** - High-value customers (>100,000 ETB spent, 10+ orders)
- **Frequent** - Regular buyers (5+ orders, purchased in last 30 days)
- **Occasional** - Infrequent buyers (2-4 orders)
- **At Risk** - Inactive customers (last order >90 days ago)
- **New** - Recently joined (< 30 days)

**Features:**
- Calculate customer lifetime value
- Track purchase frequency
- Identify at-risk customers
- Send targeted communications

**Response Example:**
```json
{
  "success": true,
  "summary": {
    "totalCustomers": 1520,
    "vip": 45,
    "frequent": 230,
    "occasional": 580,
    "atRisk": 165,
    "new": 120
  },
  "segments": {
    "vip": [
      {
        "id": "uuid",
        "email": "customer@example.com",
        "name": "John Doe",
        "totalSpent": 250000,
        "orderCount": 15,
        "averageOrderValue": 16666,
        "lastOrderDate": "2024-12-20",
        "segment": "VIP"
      }
    ]
  }
}
```

**Send Targeted Communication:**

`POST /api/admin/crm`

```json
{
  "customerIds": ["uuid1", "uuid2"],
  "subject": "Special Offer for Our VIP Customers",
  "message": "<html>Email content here</html>"
}
```

### 6. Site Configuration Management

**Endpoint:** `GET /api/admin/site-config` (Get) | `PUT /api/admin/site-config` (Update)

**Description:** Manage global site settings and configurations.

**Configurable Settings:**
- **Maintenance Mode** - Enable/disable site-wide maintenance
- **Maintenance Message** - Custom message during maintenance
- **Featured Products** - Homepage featured products
- **Homepage Banners** - Promotional banners
- **Announcement Bar** - Top-of-page announcements
- **New Vendor Registration** - Allow/disallow new vendor signups
- **New Customer Registration** - Allow/disallow new customer signups
- **Order Limits** - Minimum and maximum order amounts
- **Currency** - Default currency (ETB)
- **Tax Rate** - Default tax rate (15% VAT)
- **Shipping** - Enable/disable shipping
- **Notifications** - Email and SMS notification settings

**Update Example:**
```json
{
  "maintenanceMode": true,
  "maintenanceMessage": "We're upgrading our systems. Be back soon!",
  "announcementBar": {
    "enabled": true,
    "message": "🎉 Holiday Sale: 20% off everything!",
    "type": "success"
  },
  "allowNewVendors": true,
  "minOrderAmount": 100,
  "maxOrderAmount": 500000
}
```

## Advanced Admin Dashboard UI

The `AdvancedAdminFeatures` component provides a modern, real-time dashboard interface with:

### Features:
1. **Auto-Refresh** - Automatic data refresh every 30 seconds (toggle on/off)
2. **Live Statistics** - Real-time KPIs with visual indicators
3. **Notification Center** - Categorized alerts with action links
4. **Recent Activity Feed** - Latest platform events
5. **Report Generation** - One-click CSV export for all report types
6. **Quick Tools** - Direct access to site configuration and CRM

### Tabs:
- **Notifications** - Active alerts and warnings
- **Recent Activity** - Latest orders and user actions
- **Reports** - Generate and download reports
- **Quick Tools** - Site configuration and customer segments

## Integration

The advanced features are integrated into the existing admin dashboard:

1. Navigate to `/admin/dashboard`
2. Click on the "Advanced" tab
3. Access all advanced features from a single interface

## Security

All advanced admin endpoints are protected with:
- JWT authentication
- Admin role verification
- Request validation
- Error handling with logging

**Authentication Check:**
```typescript
const token = getTokenFromRequest(req);
const user = await getUserFromToken(token);
if (!user || !isAdmin(user.email)) {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}
```

## Database Schema

### SiteSettings Model

```prisma
model SiteSettings {
  id                   String   @id @default(dbgenerated("gen_random_uuid()"))
  maintenanceMode      Boolean  @default(false)
  maintenanceMessage   String?
  featuredProducts     Json?
  homepageBanners      Json?
  announcementBar      Json?
  allowNewVendors      Boolean  @default(true)
  allowNewCustomers    Boolean  @default(true)
  minOrderAmount       Decimal  @default(0)
  maxOrderAmount       Decimal  @default(1000000)
  defaultCurrency      String   @default("ETB")
  taxRate              Decimal  @default(0.15)
  shippingEnabled      Boolean  @default(true)
  emailNotifications   Boolean  @default(true)
  smsNotifications     Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## Performance Considerations

1. **Caching** - Live stats use efficient database queries
2. **Pagination** - Report endpoints support pagination
3. **Rate Limiting** - Protect against abuse
4. **Indexing** - Database indexes on frequently queried fields
5. **Lazy Loading** - Load data only when needed

## Best Practices

1. **Monitor Notifications** - Check the notification center regularly
2. **Use Bulk Operations** - Save time by updating multiple items at once
3. **Generate Regular Reports** - Export weekly/monthly reports for analysis
4. **Segment Customers** - Use CRM to identify high-value customers
5. **Configure Site Settings** - Keep settings up to date
6. **Review Live Stats** - Monitor platform health in real-time

## Future Enhancements

Planned improvements:
- [ ] WebSocket support for true real-time updates
- [ ] Advanced fraud detection with machine learning
- [ ] Automated report scheduling and email delivery
- [ ] Custom dashboard widgets
- [ ] A/B testing framework
- [ ] Advanced analytics with custom metrics
- [ ] Multi-channel notification system
- [ ] Automated customer re-engagement campaigns

## Support

For questions or issues:
1. Check API endpoint documentation
2. Review error logs in the browser console
3. Verify admin credentials and permissions
4. Contact the development team

---

**Last Updated:** December 24, 2024  
**Version:** 1.0.0
