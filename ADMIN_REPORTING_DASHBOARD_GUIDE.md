# Admin Reporting Dashboard - Implementation Guide

## Overview
The Admin Reporting Dashboard provides comprehensive reporting capabilities for analyzing sales, inventory, customers, vendors, and operational metrics. Reports can be exported in multiple formats including JSON, CSV, Excel (XLSX), and PDF.

## Features

### Report Types

1. **Sales Reports**
   - Daily, weekly, and monthly sales analytics
   - Top-selling products
   - Revenue breakdown by period
   - Average order value
   
2. **Vendor Performance Reports**
   - Total sales per vendor
   - Commission calculations
   - Average ratings
   - Product count and order count

3. **Product Performance Reports**
   - Sales volume and revenue per product
   - View count and conversion rates
   - Stock levels
   - Product ratings

4. **Customer Acquisition Reports**
   - New customer registrations
   - Conversion rates (first purchase)
   - Cohort analysis by period
   - Lifetime value

5. **Refund & Return Reports**
   - Total refunds and amounts
   - Refund reasons breakdown
   - Status distribution
   - Vendor impact

6. **Shipping Performance Reports**
   - Average delivery time
   - Courier performance
   - In-transit vs delivered shipments
   - Shipping revenue

7. **Payment Gateway Reports**
   - Success/failure rates
   - Payment method distribution
   - Revenue by payment method
   - Transaction volume

8. **Inventory Aging Reports**
   - Slow-moving stock (30-90 days)
   - Dead stock (>180 days)
   - Stock value by age category
   - Days in stock analysis

9. **Tax Reports**
   - VAT collection by vendor
   - Total tax collected
   - Vendor TIN numbers
   - Compliance reporting for Ethiopian authorities

10. **Financial Summary Reports**
    - Total revenue
    - Refunds and net revenue
    - Tax collected
    - Shipping revenue

### Export Formats

- **JSON**: For API integration and preview
- **CSV**: For spreadsheet applications
- **Excel (XLSX)**: For advanced Excel features
- **PDF**: For printing and archival

## API Usage

### Endpoint
```
GET /api/admin/reports
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Report type (see Report Types above) |
| `format` | string | No | Export format: `json`, `csv`, `excel`, `pdf` (default: `json`) |
| `startDate` | string (ISO 8601) | No | Filter start date |
| `endDate` | string (ISO 8601) | No | Filter end date |
| `period` | string | No | Aggregation period: `daily`, `weekly`, `monthly` (only for sales and customer-acquisition) |

### Examples

#### Get Sales Report in JSON
```bash
GET /api/admin/reports?type=sales&startDate=2024-01-01&endDate=2024-01-31
```

#### Export Vendor Performance to Excel
```bash
GET /api/admin/reports?type=vendor-performance&format=excel&startDate=2024-01-01
```

#### Generate Monthly Sales Report as PDF
```bash
GET /api/admin/reports?type=sales&period=monthly&format=pdf
```

#### Get Tax Report for Ethiopian Authorities
```bash
GET /api/admin/reports?type=tax&startDate=2024-01-01&endDate=2024-03-31&format=excel
```

## UI Access

### Admin Reports Dashboard
Navigate to: `/admin/reports`

**Features:**
- Visual report type selector
- Date range picker
- Period aggregation selector
- Export format chooser
- Live preview for JSON reports
- One-click download for CSV/Excel/PDF

### Usage Flow
1. Log in as admin
2. Navigate to Admin Dashboard → Reports
3. Select report type from dropdown or card grid
4. Choose date range (optional)
5. Select export format
6. Click "Generate Report"
7. For JSON: view preview in browser
8. For CSV/Excel/PDF: file downloads automatically

## Security

### Authentication
- Requires valid JWT token
- Admin role verification via `ADMIN_EMAILS` environment variable

### Authorization
All reports endpoints check:
1. User authentication (valid token)
2. Admin status (email in `ADMIN_EMAILS`)

Access is denied if either check fails.

## Dependencies

### NPM Packages
- `papaparse` (^5.4.1) - CSV generation
- `xlsx` (^0.18.5) - Excel file generation
- `jspdf` (^3.0.4) - PDF generation (already installed)

### Installation
```bash
npm install papaparse xlsx @types/papaparse
```

## Code Structure

### Files Created
1. `/src/lib/report-export.ts` - Export utility functions
   - `exportToCSV()` - CSV generation
   - `exportToExcel()` - XLSX generation
   - `exportToPDF()` - PDF generation
   - Helper functions for formatting and aggregation

2. `/app/api/admin/reports/route.ts` - Enhanced API endpoint
   - 10 report generation functions
   - Export format handling
   - Authentication and authorization

3. `/app/admin/reports/page.tsx` - Page wrapper with auth
4. `/src/page-components/AdminReportsDashboard.tsx` - UI component

### Key Functions

#### Report Generation Functions
- `generateSalesReport(dateFilter, period?)`
- `generateVendorPerformanceReport(dateFilter)`
- `generateProductPerformanceReport(dateFilter)`
- `generateCustomerAcquisitionReport(dateFilter, period?)`
- `generateRefundsReport(dateFilter)`
- `generateShippingReport(dateFilter)`
- `generatePaymentGatewayReport(dateFilter)`
- `generateInventoryAgingReport()`
- `generateTaxReport(dateFilter)`
- `generateFinancialReport(dateFilter)`

#### Export Utility Functions
- `createCSVResponse(data, filename)`
- `createExcelResponse(data, filename, title?)`
- `createPDFResponse(data, filename, title?)`
- `aggregateByPeriod(data, dateField, period)`

## Customization

### Adding New Report Types
1. Add report case to switch statement in `/app/api/admin/reports/route.ts`
2. Create generation function following pattern
3. Add report type to UI selector in `AdminReportsDashboard.tsx`

### Customizing Export Formats
Edit `/src/lib/report-export.ts`:
- Modify CSV headers/formatting in `exportToCSV()`
- Customize Excel styling in `exportToExcel()`
- Enhance PDF layout in `exportToPDF()`

## Testing

Run tests:
```bash
npm test src/__tests__/admin-reports.test.ts
```

Tests verify:
- File structure exists
- All report types documented
- All export formats supported

## Performance Considerations

### Large Datasets
- Reports include all matching records (no pagination in export)
- For very large datasets (>10,000 records), consider:
  - Using date filters to limit scope
  - Generating reports during off-peak hours
  - Implementing background job processing

### Optimization Tips
- Use specific date ranges
- Export CSV for fastest generation
- Use JSON preview before downloading
- Schedule heavy reports (e.g., annual) during low-traffic periods

## Ethiopian Market Compliance

### Tax Reporting
The tax report includes:
- Vendor TIN (Tax Identification Number)
- VAT collected per vendor
- Total sales amount
- Reporting period

This format aligns with Ethiopian tax authority requirements for marketplace platforms.

## Troubleshooting

### "Authentication required" error
- Ensure you're logged in as admin
- Check JWT token is valid
- Verify email is in `ADMIN_EMAILS` environment variable

### Empty Reports
- Check date range filters
- Verify data exists in database for selected period
- Ensure order statuses match report criteria (e.g., only 'delivered' orders in sales reports)

### Export Download Issues
- Check browser popup blockers
- Ensure sufficient browser storage
- Try different export format

## Future Enhancements

Potential additions:
- Scheduled report generation
- Email delivery of reports
- Custom report builder
- Dashboard widgets with real-time metrics
- Report templates and saved configurations
- Multi-currency support
- Advanced filtering (by vendor, category, region)
- Comparative analysis (YoY, MoM)

## Support

For issues or questions:
1. Check this documentation
2. Review API response error messages
3. Check application logs
4. Contact development team

## Changelog

### Version 1.0.0 (2024-01)
- Initial implementation
- 10 report types
- 4 export formats
- Admin UI dashboard
- Period aggregation for sales and customer reports
