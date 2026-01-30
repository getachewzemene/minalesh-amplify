# Analytics & Reporting API Documentation

## Overview
The Analytics API provides comprehensive business intelligence features including sales analytics, conversion funnels, cohort retention analysis, and regional performance metrics. All endpoints require admin authentication.

## Authentication
All analytics endpoints require:
- Valid JWT token in Authorization header
- Admin role (verified via RBAC)

```bash
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Overview Analytics
Get a comprehensive snapshot of key performance indicators with period-over-period comparison.

**Endpoint**: `GET /api/analytics/overview`

**Query Parameters**:
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)

**Example Request**:
```bash
GET /api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "currentPeriod": {
    "revenue": 2543200,
    "orders": 1254,
    "avgOrderValue": 2028,
    "uniqueUsers": 842,
    "conversionRate": 14.9
  },
  "previousPeriod": {
    "revenue": 2102300,
    "orders": 1048,
    "avgOrderValue": 2005,
    "uniqueUsers": 720
  },
  "changes": {
    "revenue": 20.97,
    "orders": 19.66,
    "avgOrderValue": 1.15,
    "users": 16.94
  },
  "overview": {
    "totalProducts": 482,
    "activeVendors": 87,
    "totalUsers": 4821,
    "totalCategories": 48,
    "avgRating": 4.8
  },
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

**Use Cases**:
- Dashboard KPI cards
- Executive summaries
- Performance tracking
- Trend identification

---

### 2. Sales Analytics
Get detailed sales metrics including revenue, orders, and time-series trends.

**Endpoint**: `GET /api/analytics/sales`

**Query Parameters**:
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)
- `groupBy` (optional): 'day' | 'week' | 'month' (default: 'day')

**Example Request**:
```bash
GET /api/analytics/sales?groupBy=week&startDate=2024-01-01&endDate=2024-03-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "totalRevenue": 7629600,
  "totalOrders": 3762,
  "averageOrderValue": 2028,
  "uniqueUsers": 2526,
  "trends": [
    {
      "date": "2024-W01",
      "revenue": 584200,
      "orders": 288,
      "users": 193
    },
    {
      "date": "2024-W02",
      "revenue": 612800,
      "orders": 302,
      "users": 207
    }
  ],
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-03-31T23:59:59.999Z",
    "groupBy": "week"
  }
}
```

**Use Cases**:
- Revenue trend charts
- Sales forecasting
- Period comparison
- Performance monitoring

---

### 3. Conversion Funnel Analytics
Track user journey through the purchase funnel with drop-off rates at each stage.

**Endpoint**: `GET /api/analytics/conversion-funnel`

**Query Parameters**:
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)

**Example Request**:
```bash
GET /api/analytics/conversion-funnel?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "funnel": [
    {
      "stage": "Product Views",
      "value": 25000,
      "rate": 100,
      "dropOff": 0
    },
    {
      "stage": "Add to Cart",
      "value": 8000,
      "rate": 32.0,
      "dropOff": 68.0
    },
    {
      "stage": "Checkout Started",
      "value": 4500,
      "rate": 56.25,
      "dropOff": 43.75
    },
    {
      "stage": "Payment Info",
      "value": 3200,
      "rate": 71.11,
      "dropOff": 28.89
    },
    {
      "stage": "Order Complete",
      "value": 2500,
      "rate": 78.13,
      "dropOff": 21.87
    }
  ],
  "overallConversionRate": 10.0,
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  },
  "note": "Product Views are estimated based on wishlist activity and order patterns. For more accurate tracking, implement client-side analytics."
}
```

**Funnel Stages**:
1. **Product Views**: Estimated from user activity
2. **Add to Cart**: Users who added items to cart
3. **Checkout Started**: Orders created
4. **Payment Info**: Orders with payment method selected
5. **Order Complete**: Successfully paid orders

**Use Cases**:
- Identify conversion bottlenecks
- Optimize checkout flow
- A/B testing validation
- User journey analysis

**Note**: Product Views are approximated based on available data. For precise tracking, integrate client-side analytics (Google Analytics, Mixpanel, etc.).

---

### 4. Cohort Retention Analysis
Analyze customer retention over time by grouping users into cohorts based on their first purchase date.

**Endpoint**: `GET /api/analytics/cohort-retention`

**Query Parameters**:
- `cohortType` (optional): 'week' | 'month' (default: 'week')
- `cohortCount` (optional): number of cohorts to analyze (default: 8)

**Example Request**:
```bash
GET /api/analytics/cohort-retention?cohortType=week&cohortCount=8
Authorization: Bearer <token>
```

**Response**:
```json
{
  "cohorts": [
    {
      "cohort": "2024 Week 04",
      "cohortDate": "2024-W04",
      "size": 127,
      "week0": 100,
      "week1": 75,
      "week2": 62,
      "week3": 51,
      "week4": 43,
      "week5": 38,
      "week6": 35,
      "week7": 32
    },
    {
      "cohort": "2024 Week 03",
      "cohortDate": "2024-W03",
      "size": 142,
      "week0": 100,
      "week1": 72,
      "week2": 58,
      "week3": 46,
      "week4": 39,
      "week5": 34,
      "week6": 31,
      "week7": 28
    }
  ],
  "cohortType": "week",
  "periodLabels": ["week0", "week1", "week2", ...]
}
```

**Cohort Metrics**:
- **size**: Number of users in the cohort
- **week0/month0**: Always 100% (baseline)
- **weekN/monthN**: Percentage of users who made purchases in that period

**Use Cases**:
- Customer lifetime value analysis
- Retention strategy effectiveness
- Churn prediction
- Product-market fit validation

**Interpretation**:
- High week1 retention (>60%): Strong product-market fit
- Stable retention curve: Healthy long-term engagement
- Steep drop-offs: Need to improve onboarding/engagement

---

### 5. Product Performance Analytics
Analyze top-performing products and revenue distribution by category.

**Endpoint**: `GET /api/analytics/products`

**Query Parameters**:
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)
- `limit` (optional): number of top products (default: 10)

**Example Request**:
```bash
GET /api/analytics/products?limit=5&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "topProducts": [
    {
      "rank": 1,
      "id": "prod-123",
      "name": "iPhone 15 Pro Max",
      "revenue": 4049550,
      "unitsSold": 450,
      "categoryName": "Electronics"
    },
    {
      "rank": 2,
      "id": "prod-456",
      "name": "Samsung Galaxy S24",
      "revenue": 2560000,
      "unitsSold": 320,
      "categoryName": "Electronics"
    }
  ],
  "categoryBreakdown": [
    {
      "name": "Electronics",
      "revenue": 12600000,
      "orders": 890,
      "percentage": 45.2
    },
    {
      "name": "Fashion",
      "revenue": 6980000,
      "orders": 650,
      "percentage": 25.0
    },
    {
      "name": "Home & Garden",
      "revenue": 4172000,
      "orders": 380,
      "percentage": 15.0
    }
  ],
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

**Use Cases**:
- Inventory optimization
- Marketing focus
- Category performance
- Product recommendations

---

### 6. Regional Performance Analytics
Analyze sales performance by geographic region based on shipping addresses.

**Endpoint**: `GET /api/analytics/regional`

**Query Parameters**:
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: now)

**Example Request**:
```bash
GET /api/analytics/regional?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "regionalData": [
    {
      "region": "Addis Ababa",
      "revenue": 8500000,
      "orders": 2100,
      "users": 1420,
      "percentage": 37.2
    },
    {
      "region": "Oromia",
      "revenue": 4200000,
      "orders": 1050,
      "users": 710,
      "percentage": 18.4
    },
    {
      "region": "Amhara",
      "revenue": 3100000,
      "orders": 780,
      "users": 530,
      "percentage": 13.6
    }
  ],
  "totalRevenue": 22850000,
  "totalOrders": 5720,
  "totalUsers": 3890,
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

**Use Cases**:
- Regional marketing strategies
- Logistics optimization
- Expansion planning
- Regional pricing strategies

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden - Admin access required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch <endpoint> analytics"
}
```

---

## Implementation Notes

### Performance Considerations
1. **Caching**: Consider implementing Redis caching for frequently accessed analytics
2. **Indexing**: Ensure database indexes on:
   - `orders.createdAt`
   - `orders.status`
   - `orders.userId`
   - `orderItems.productId`

3. **Query Optimization**: Analytics queries use:
   - Aggregate functions for efficiency
   - Filtered queries to exclude cancelled/refunded orders
   - Grouped queries to reduce data transfer

### Data Accuracy
- Sales metrics exclude cancelled and refunded orders
- Conversion funnel uses approximations where client-side tracking isn't available
- Regional data depends on complete shipping address information
- Cohort analysis requires users to have made at least one order

### Rate Limiting
Consider implementing rate limiting:
- 100 requests per hour per admin user
- 1000 requests per day per admin user

### Future Enhancements
1. **Real-time Analytics**: Implement WebSocket for live dashboard updates
2. **Custom Date Ranges**: Add support for fiscal years, quarters
3. **Export Formats**: Add CSV, PDF export options
4. **Scheduled Reports**: Email automated reports
5. **Benchmarking**: Compare against industry averages
6. **Predictive Analytics**: ML-based forecasting
7. **Drill-down**: Detailed analysis by clicking on data points

---

## Example Integration

### Frontend Integration (React/Next.js)
```typescript
// hooks/useAnalytics.ts
import { useState, useEffect } from 'react';

export function useSalesAnalytics(startDate: string, endDate: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams({
          startDate,
          endDate,
          groupBy: 'day'
        });
        
        const response = await fetch(
          `/api/analytics/sales?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate]);

  return { data, loading, error };
}
```

### Usage in Component
```typescript
import { useSalesAnalytics } from '@/hooks/useAnalytics';
import { LineChart } from 'recharts';

export function SalesChart() {
  const { data, loading, error } = useSalesAnalytics(
    '2024-01-01',
    '2024-01-31'
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Total Revenue: {data.totalRevenue.toLocaleString()} ETB</h2>
      <LineChart data={data.trends} />
    </div>
  );
}
```

---

## Testing

### Unit Tests
See `src/__tests__/analytics.test.ts` for comprehensive test coverage including:
- Date grouping functions
- Percentage change calculations
- Cohort key generation
- Regional data extraction
- Funnel rate calculations

### Manual Testing
```bash
# Get overview analytics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/overview"

# Get sales trends
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/sales?groupBy=week"

# Get conversion funnel
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/conversion-funnel"

# Get cohort retention
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/analytics/cohort-retention?cohortType=week"
```

---

## Security Considerations

1. **Authentication**: All endpoints verify JWT token
2. **Authorization**: RBAC ensures only admins can access
3. **Data Sanitization**: All inputs are validated
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **Rate Limiting**: Should be implemented in production
6. **Audit Logging**: Consider logging analytics access

---

## Support

For issues or questions:
- Check implementation in `app/api/analytics/` directory
- Review tests in `src/__tests__/analytics.test.ts`
- Refer to Prisma schema in `prisma/schema.prisma`
