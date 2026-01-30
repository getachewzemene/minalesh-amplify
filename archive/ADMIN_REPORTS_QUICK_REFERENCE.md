# Admin Reporting Dashboard - Quick Reference

## Report Types & URLs

| Report Type | Query Parameter | Description |
|-------------|----------------|-------------|
| Sales | `type=sales` | Daily/weekly/monthly sales analytics |
| Vendor Performance | `type=vendor-performance` | Vendor sales, commissions, ratings |
| Product Performance | `type=product-performance` | Product sales, views, conversions |
| Customer Acquisition | `type=customer-acquisition` | New customers and conversion rates |
| Refunds | `type=refunds` | Refund requests and reasons |
| Shipping | `type=shipping` | Delivery times and performance |
| Payment Gateway | `type=payment-gateway` | Payment success rates |
| Inventory Aging | `type=inventory-aging` | Slow-moving and dead stock |
| Tax | `type=tax` | Tax collection for authorities |
| Financial | `type=financial` | Revenue and financial summary |

## Export Formats

| Format | Query Parameter | File Extension | Use Case |
|--------|----------------|----------------|----------|
| JSON | `format=json` | - | API/Preview |
| CSV | `format=csv` | .csv | Spreadsheets |
| Excel | `format=excel` | .xlsx | Advanced Excel |
| PDF | `format=pdf` | .pdf | Printing/Archive |

## Common Examples

### Export Monthly Sales to Excel
```
/api/admin/reports?type=sales&period=monthly&format=excel&startDate=2024-01-01&endDate=2024-12-31
```

### Get Vendor Performance CSV
```
/api/admin/reports?type=vendor-performance&format=csv
```

### Generate Tax Report PDF
```
/api/admin/reports?type=tax&format=pdf&startDate=2024-01-01&endDate=2024-03-31
```

## Access
- **Admin UI**: `/admin/reports`
- **API Endpoint**: `/api/admin/reports`
- **Required**: Admin authentication

## Key Features
✅ 10 comprehensive report types  
✅ 4 export formats (JSON, CSV, Excel, PDF)  
✅ Date range filtering  
✅ Period aggregation (daily, weekly, monthly)  
✅ Real-time generation  
✅ Ethiopian tax compliance  

## Files Modified/Created
- `app/api/admin/reports/route.ts` - Enhanced API
- `src/lib/report-export.ts` - Export utilities
- `app/admin/reports/page.tsx` - Admin page
- `src/page-components/AdminReportsDashboard.tsx` - UI component
- Dependencies: `exceljs`, `papaparse` added (xlsx replaced with exceljs for security)
