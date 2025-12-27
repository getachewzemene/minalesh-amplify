# Seller Ratings and Ethiopian Tax Compliance - Feature Documentation

## Overview

This document describes the implementation of two key features:
1. **Seller Ratings and Verification** - A comprehensive rating system for vendors
2. **Ethiopian Tax Compliance Enhancements** - Tax utilities and reporting for Ethiopian market compliance

---

## 1. Seller Ratings System

### Purpose
The seller rating system allows customers to rate vendors after receiving orders, providing transparency and trust in the marketplace. It tracks multiple aspects of vendor performance.

### Features

#### Rating Categories
Vendors are rated on 4 dimensions (scale 1-5):
- **Communication** - How well the vendor communicated during the order process
- **Shipping Speed** - How quickly the vendor processed and shipped the order
- **Accuracy** - How accurately the order matched the description
- **Customer Service** - Quality of customer service provided

#### Overall Rating
The overall rating is automatically calculated as the average of the 4 category ratings.

### API Endpoints

#### Submit Seller Rating
**POST** `/api/seller-ratings`

**Authentication**: Required (Customer or Admin)

**Request Body**:
```json
{
  "orderId": "uuid",
  "vendorId": "uuid",
  "communication": 5,
  "shippingSpeed": 4,
  "accuracy": 5,
  "customerService": 5,
  "comment": "Excellent service!"
}
```

**Response** (201):
```json
{
  "message": "Seller rating submitted successfully",
  "rating": {
    "id": "uuid",
    "overallRating": 4.75,
    "createdAt": "2024-12-26T12:00:00.000Z"
  }
}
```

**Validation**:
- Order must exist and belong to the user
- Vendor must be part of the specified order
- User can only rate each order once
- All rating values must be between 1-5

#### Get Seller Ratings
**GET** `/api/seller-ratings?vendorId={uuid}&page=1&perPage=20`

**Authentication**: Not required (public)

**Response** (200):
```json
{
  "ratings": [
    {
      "id": "uuid",
      "communication": 5,
      "shippingSpeed": 4,
      "accuracy": 5,
      "customerService": 5,
      "overallRating": 4.75,
      "comment": "Excellent service!",
      "createdAt": "2024-12-26T12:00:00.000Z",
      "user": {
        "displayName": "John Doe"
      }
    }
  ],
  "statistics": {
    "totalRatings": 150,
    "averageOverallRating": 4.65,
    "averageCommunication": 4.70,
    "averageShippingSpeed": 4.55,
    "averageAccuracy": 4.68,
    "averageCustomerService": 4.70
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Get Vendor Statistics
**GET** `/api/vendors/stats?vendorId={uuid}`

**Authentication**: Not required (public)

**Response** (200):
```json
{
  "vendor": {
    "id": "uuid",
    "displayName": "Amazing Store",
    "status": "approved",
    "memberSince": "2023-01-15T00:00:00.000Z"
  },
  "verification": {
    "status": "approved",
    "verifiedAt": "2023-01-20T00:00:00.000Z"
  },
  "ratings": {
    "totalRatings": 150,
    "averageOverallRating": 4.65,
    "averageCommunication": 4.70,
    "averageShippingSpeed": 4.55,
    "averageAccuracy": 4.68,
    "averageCustomerService": 4.70
  },
  "products": {
    "totalActive": 45
  },
  "sales": {
    "totalItemsSold": 1250
  }
}
```

### Database Schema

The `seller_ratings` table includes:
- `id` - Unique identifier
- `vendor_id` - Foreign key to Profile
- `user_id` - Foreign key to User (reviewer)
- `order_id` - Foreign key to Order
- `communication` - Rating 1-5
- `shipping_speed` - Rating 1-5
- `accuracy` - Rating 1-5
- `customer_service` - Rating 1-5
- `overall_rating` - Calculated average (Decimal 3,2)
- `comment` - Optional text comment
- `created_at` - Timestamp

**Unique Constraint**: `(order_id, user_id)` - One rating per order per user

### Integration Points

#### Display on Product Pages
Show vendor rating statistics on product detail pages to help buyers make informed decisions.

#### Display on Vendor Profiles
Show comprehensive rating breakdown on vendor profile pages.

#### Order Confirmation
After order delivery, prompt customers to rate the vendor.

---

## 2. Ethiopian Tax Compliance Enhancements

### Purpose
Provide comprehensive tax compliance utilities and reporting for vendors operating in Ethiopia, including TIN validation, tax invoice generation, and automated tax reporting.

### Features

#### TIN Validation
Validates Ethiopian Tax Identification Numbers (TIN).

**TIN Format**: 10 digits (e.g., 0123456789)
**Display Format**: XXXX-XXX-XXX (e.g., 0123-456-789)

```typescript
import { validateEthiopianTIN, formatEthiopianTIN } from '@/lib/ethiopian-tax';

// Validate
const result = validateEthiopianTIN('0123456789');
// { isValid: true }

// Format for display
const formatted = formatEthiopianTIN('0123456789');
// "0123-456-789"
```

#### Withholding Tax Calculation
Calculates Ethiopian withholding tax:
- **Services**: 2%
- **Goods**: 3%

```typescript
import { calculateWithholdingTax } from '@/lib/ethiopian-tax';

const result = calculateWithholdingTax(1000, 'services');
// {
//   withholdingTaxRate: 0.02,
//   withholdingTaxAmount: 20,
//   netAmount: 980
// }
```

#### Tax Invoice Generation
Generates tax invoice numbers in Ethiopian format.

**Format**: ET-YYYYMMDD-NNNNNN (e.g., ET-20241226-000001)

```typescript
import { generateTaxInvoiceNumber } from '@/lib/ethiopian-tax';

const invoiceNumber = generateTaxInvoiceNumber(1);
// "ET-20241226-000001"
```

#### Tax Invoice Breakdown
Calculates complete tax breakdown for invoices.

```typescript
import { calculateEthiopianTaxInvoiceBreakdown } from '@/lib/ethiopian-tax';

const breakdown = calculateEthiopianTaxInvoiceBreakdown(1000, {
  includeVAT: true,
  vatRate: 0.15,
  includeWithholdingTax: true,
  withholdingTaxType: 'services'
});
// {
//   subtotal: 1000,
//   vatRate: 0.15,
//   vatAmount: 150,
//   withholdingTaxRate: 0.02,
//   withholdingTaxAmount: 23,
//   totalBeforeTax: 1000,
//   totalAfterTax: 1150,
//   netAmount: 1127
// }
```

#### VAT Exemptions
Identifies VAT-exempt categories in Ethiopia:
- Basic food
- Agriculture & agricultural inputs
- Medicine & medical supplies
- Books & educational materials
- Financial services
- And more...

```typescript
import { isVATExemptInEthiopia } from '@/lib/ethiopian-tax';

isVATExemptInEthiopia('medicine'); // true
isVATExemptInEthiopia('electronics'); // false
```

### API Endpoints

#### Vendor Tax Report
**GET** `/api/vendors/tax-report?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&periodType={monthly|quarterly|annual}`

**Authentication**: Required (Vendor or Admin)

**Query Parameters**:
- `startDate` - Report start date (required)
- `endDate` - Report end date (required)
- `periodType` - Report period type (default: monthly)

**Response** (200):
```json
{
  "vendor": {
    "id": "uuid",
    "displayName": "Amazing Store",
    "tinNumber": "0123456789",
    "tradeLicense": "AB123456"
  },
  "period": {
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z",
    "periodType": "monthly"
  },
  "summary": {
    "totalSales": 50000.00,
    "taxableAmount": 45000.00,
    "vatCollected": 6750.00,
    "withholdingTaxDeducted": 0.00,
    "netTaxLiability": 6750.00
  },
  "breakdown": [
    {
      "category": "electronics",
      "totalSales": 30000.00,
      "vatCollected": 4500.00,
      "itemCount": 150
    },
    {
      "category": "books",
      "totalSales": 5000.00,
      "vatCollected": 0.00,
      "itemCount": 50
    }
  ],
  "metadata": {
    "totalOrders": 125,
    "totalItems": 250,
    "generatedAt": "2024-12-26T12:00:00.000Z"
  }
}
```

### Tax Reporting Features

#### Category-Based VAT Exemptions
The system automatically identifies VAT-exempt categories and excludes them from VAT calculations.

#### Automatic VAT Calculation
Standard 15% VAT rate applied to non-exempt items.

#### Tax Report Summary
Aggregates sales data with:
- Total sales
- Taxable amount (excluding exempt items)
- VAT collected
- Withholding tax deducted
- Net tax liability

#### Category Breakdown
Detailed breakdown showing:
- Sales by category
- VAT collected per category
- Item count per category

### Business License Validation

Validates Ethiopian business license numbers.

```typescript
import { validateEthiopianBusinessLicense } from '@/lib/ethiopian-tax';

const result = validateEthiopianBusinessLicense('AB123456');
// { isValid: true }
```

**Requirements**:
- Minimum 5 characters
- Alphanumeric with spaces, dashes, or slashes allowed
- Format varies by region

---

## Testing

### Test Coverage
- **33 tests** for Ethiopian tax utilities
- **100% coverage** of validation functions
- **100% coverage** of calculation functions

### Run Tests
```bash
npm test -- src/lib/ethiopian-tax.test.ts
```

### Test Categories
1. TIN validation (8 tests)
2. TIN formatting (3 tests)
3. Withholding tax calculation (4 tests)
4. Tax invoice number generation (3 tests)
5. Tax invoice breakdown (5 tests)
6. VAT exemption checks (3 tests)
7. Tax report summary (2 tests)
8. Business license validation (5 tests)

---

## Security Considerations

### Seller Ratings
- ✅ Users can only rate orders they placed
- ✅ Vendors must be part of the order being rated
- ✅ One rating per order per user (prevents spam)
- ✅ Rating values validated (1-5 range)

### Tax Reporting
- ✅ Vendors can only access their own tax reports
- ✅ Admins can access all vendor reports
- ✅ Date range validation prevents invalid queries
- ✅ TIN and license number validation

---

## Future Enhancements

### Seller Ratings
- [ ] Rating verification badges
- [ ] Response to ratings by vendors
- [ ] Fraud detection for fake ratings
- [ ] Rating trend analysis

### Tax Compliance
- [ ] Automated tax filing integration
- [ ] Multi-currency tax reporting
- [ ] Regional tax rate variations
- [ ] Tax certificate management
- [ ] Integration with Ethiopian Revenue Authority

---

## Swagger Documentation

All API endpoints are documented in Swagger/OpenAPI format and available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://yourdomain.com/api-docs`

Tags:
- **Seller Ratings** - Rating system endpoints
- **Vendors** - Vendor statistics and management
- **Tax Compliance** - Tax reporting endpoints

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{ "error": "All rating fields are required" }
{ "error": "Rating values must be between 1 and 5" }
{ "error": "Start date and end date are required" }
```

**401 Unauthorized**:
```json
{ "error": "Unauthorized" }
```

**403 Forbidden**:
```json
{ "error": "You can only rate orders you placed" }
```

**404 Not Found**:
```json
{ "error": "Order not found" }
{ "error": "Vendor profile not found" }
```

---

## Database Migrations

No new migrations required - the schema already includes:
- `seller_ratings` table
- `vendor_verifications` table
- `tax_rates` table

---

## Conclusion

These features provide:
1. **Trust and transparency** through seller ratings
2. **Compliance** with Ethiopian tax regulations
3. **Automation** of tax calculations and reporting
4. **Verification** of tax identification numbers
5. **Professional invoicing** with proper tax documentation

The implementation is production-ready with comprehensive testing, security measures, and API documentation.
