# UI Components Guide - Seller Ratings & Tax Compliance

This guide explains how to use the UI components for seller ratings and Ethiopian tax compliance features.

## Table of Contents
1. [Seller Rating Components](#seller-rating-components)
2. [Tax Compliance Components](#tax-compliance-components)
3. [Integration Examples](#integration-examples)

---

## Seller Rating Components

### 1. SellerRatingForm

A comprehensive form component for customers to rate vendors across multiple dimensions.

#### Import
```typescript
import { SellerRatingForm } from '@/components/seller-ratings';
```

#### Props
```typescript
interface SellerRatingFormProps {
  orderId: string;          // ID of the completed order
  vendorId: string;         // ID of the vendor being rated
  vendorName: string;       // Display name of the vendor
  onSuccess?: () => void;   // Callback after successful submission
  onCancel?: () => void;    // Optional cancel callback
}
```

#### Usage Example
```tsx
import { SellerRatingForm } from '@/components/seller-ratings';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function OrderDetailsPage() {
  const [showRatingForm, setShowRatingForm] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowRatingForm(true)}>
        Rate Seller
      </Button>
      
      <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
        <DialogContent className="max-w-2xl">
          <SellerRatingForm
            orderId="order-123"
            vendorId="vendor-456"
            vendorName="Amazing Store"
            onSuccess={() => {
              setShowRatingForm(false);
              // Optionally refresh order data
            }}
            onCancel={() => setShowRatingForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Features
- **4 Rating Dimensions**: Communication, Shipping Speed, Accuracy, Customer Service
- **Interactive Star Rating**: Hover effects and visual feedback
- **Automatic Overall Rating**: Calculates average of 4 dimensions
- **Optional Comments**: 500-character limit with counter
- **Validation**: Ensures all categories are rated before submission
- **Error Handling**: User-friendly error messages

---

### 2. SellerRatingsDisplay

Displays vendor ratings with statistics and individual reviews.

#### Import
```typescript
import { SellerRatingsDisplay } from '@/components/seller-ratings';
```

#### Props
```typescript
interface SellerRatingsDisplayProps {
  vendorId: string;        // ID of the vendor
  showTitle?: boolean;     // Show "Seller Ratings" title (default: true)
  maxRatings?: number;     // Max number of ratings to display (default: 10)
}
```

#### Usage Example
```tsx
import { SellerRatingsDisplay } from '@/components/seller-ratings';

// On product page
function ProductPage({ productId, vendorId }: { productId: string; vendorId: string }) {
  return (
    <div className="space-y-8">
      {/* Product details */}
      
      {/* Seller ratings section */}
      <SellerRatingsDisplay 
        vendorId={vendorId}
        showTitle={true}
        maxRatings={5}
      />
    </div>
  );
}

// On vendor profile page
function VendorProfilePage({ vendorId }: { vendorId: string }) {
  return (
    <div className="space-y-6">
      <h1>Vendor Profile</h1>
      
      <SellerRatingsDisplay 
        vendorId={vendorId}
        maxRatings={20}
      />
    </div>
  );
}
```

#### Features
- **Overall Statistics**: Average ratings across all dimensions
- **Category Breakdown**: Visual progress bars for each dimension
- **Excellence Badge**: Shows "Excellent Seller Rating" for 4.5+ ratings
- **Individual Reviews**: List of recent reviews with user info
- **Responsive Design**: Adapts to mobile and desktop screens
- **Loading States**: Skeleton loaders during data fetch
- **Error Handling**: Graceful error display

---

### 3. VendorStatsCard

A comprehensive vendor information card with ratings, verification status, and sales data.

#### Import
```typescript
import { VendorStatsCard } from '@/components/seller-ratings';
```

#### Props
```typescript
interface VendorStatsCardProps {
  vendorId: string;    // ID of the vendor
  compact?: boolean;   // Use compact layout (default: false)
}
```

#### Usage Example
```tsx
import { VendorStatsCard } from '@/components/seller-ratings';

// Full card on product page
function ProductPage({ vendorId }: { vendorId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {/* Product details */}
      </div>
      
      <aside>
        <VendorStatsCard vendorId={vendorId} />
      </aside>
    </div>
  );
}

// Compact card in product grid
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="space-y-4">
      {/* Product image and details */}
      
      <VendorStatsCard 
        vendorId={product.vendorId} 
        compact={true}
      />
    </div>
  );
}
```

#### Features
- **Verification Badge**: Shows verified/not verified status
- **Rating Summary**: Star rating with count
- **Category Ratings**: Progress bars for all 4 dimensions
- **Top Rated Badge**: For vendors with 4.5+ rating
- **Sales Statistics**: Product count and items sold
- **Two Layouts**: Full and compact modes
- **Member Since**: Shows how long vendor has been active

---

## Tax Compliance Components

### TaxReportDashboard

A complete dashboard for generating and exporting Ethiopian tax compliance reports.

#### Import
```typescript
import { TaxReportDashboard } from '@/components/tax-compliance';
```

#### Props
```typescript
interface TaxReportDashboardProps {
  vendorId?: string;  // Optional: Auto-fetches from auth context if not provided
}
```

#### Usage Example
```tsx
import { TaxReportDashboard } from '@/components/tax-compliance';

// In vendor dashboard
function VendorDashboard() {
  return (
    <div className="space-y-6">
      <h1>Tax Compliance</h1>
      
      <TaxReportDashboard />
    </div>
  );
}

// In admin panel (viewing specific vendor)
function AdminVendorTaxView({ vendorId }: { vendorId: string }) {
  return (
    <div>
      <h2>Tax Reports for Vendor</h2>
      <TaxReportDashboard vendorId={vendorId} />
    </div>
  );
}
```

#### Features
- **Period Selection**: Monthly, quarterly, or annual reports
- **Date Range Picker**: Custom date selection
- **Report Generation**: Fetches data from API
- **CSV Export**: Downloads formatted tax report
- **Vendor Information**: TIN, trade license display
- **Tax Summary**: 
  - Total sales
  - Taxable amount
  - VAT collected (15%)
  - Withholding tax
  - Net tax liability
- **Category Breakdown**: Tax details by product category
- **Ethiopian Compliance**: TIN formatting, ETB currency

---

## Integration Examples

### Complete Product Page Integration

```tsx
'use client'

import { useState } from 'react';
import { SellerRatingsDisplay, VendorStatsCard } from '@/components/seller-ratings';
import { Button } from '@/components/ui/button';

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product details */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{product?.name}</h1>
            {/* ... product images, description, etc ... */}
          </div>
          
          {/* Seller Ratings */}
          <SellerRatingsDisplay 
            vendorId={product?.vendorId || ''}
            maxRatings={5}
          />
        </div>
        
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Vendor Info Card */}
          <VendorStatsCard vendorId={product?.vendorId || ''} />
          
          {/* Add to cart, etc */}
        </aside>
      </div>
    </div>
  );
}
```

### Vendor Dashboard with Tax Reports

```tsx
'use client'

import { TaxReportDashboard } from '@/components/tax-compliance';
import { SellerRatingsDisplay } from '@/components/seller-ratings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';

export default function VendorDashboard() {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">My Ratings</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Dashboard overview */}
        </TabsContent>
        
        <TabsContent value="ratings">
          <SellerRatingsDisplay 
            vendorId={profile?.id || ''}
            maxRatings={20}
          />
        </TabsContent>
        
        <TabsContent value="tax">
          <TaxReportDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Order Completion with Rating Prompt

```tsx
'use client'

import { useState, useEffect } from 'react';
import { SellerRatingForm } from '@/components/seller-ratings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function OrderDetailsPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const canRate = order?.status === 'delivered' && !hasRated;

  return (
    <div className="container mx-auto py-8">
      <h1>Order Details</h1>
      
      {/* Order information */}
      
      {canRate && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="mb-2">How was your experience with this seller?</p>
          <Button onClick={() => setShowRatingForm(true)}>
            Rate Seller
          </Button>
        </div>
      )}
      
      <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <SellerRatingForm
            orderId={orderId}
            vendorId={order?.vendorId || ''}
            vendorName={order?.vendorName || ''}
            onSuccess={() => {
              setShowRatingForm(false);
              setHasRated(true);
            }}
            onCancel={() => setShowRatingForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Styling and Customization

All components use:
- **shadcn/ui** components for consistent styling
- **Tailwind CSS** for utility classes
- **Dark mode** support out of the box
- **Responsive design** with mobile-first approach

### Customizing Colors

The components use theme colors. To customize:

```tsx
// In your tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Customize rating colors
        'rating-star': '#facc15', // yellow-400
        'rating-empty': '#d1d5db', // gray-300
      }
    }
  }
}
```

### Customizing Layout

Components accept standard className props for wrapper customization:

```tsx
<div className="my-custom-wrapper">
  <SellerRatingsDisplay vendorId={vendorId} />
</div>
```

---

## API Requirements

These components require the following API endpoints to be available:

1. **POST /api/seller-ratings** - Submit rating
2. **GET /api/seller-ratings?vendorId={id}** - Get ratings
3. **GET /api/vendors/stats?vendorId={id}** - Get vendor stats
4. **GET /api/vendors/tax-report?startDate={}&endDate={}&periodType={}** - Generate tax report

All endpoints are already implemented in this PR.

---

## TypeScript Types

### Seller Rating Types

```typescript
interface SellerRating {
  id: string;
  communication: number;
  shippingSpeed: number;
  accuracy: number;
  customerService: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
  user: {
    displayName: string;
  };
}

interface RatingStatistics {
  totalRatings: number;
  averageOverallRating: number;
  averageCommunication: number;
  averageShippingSpeed: number;
  averageAccuracy: number;
  averageCustomerService: number;
}
```

### Tax Report Types

```typescript
interface TaxReport {
  vendor: {
    id: string;
    displayName: string;
    tinNumber?: string;
    tradeLicense?: string;
  };
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
  summary: {
    totalSales: number;
    taxableAmount: number;
    vatCollected: number;
    withholdingTaxDeducted: number;
    netTaxLiability: number;
  };
  breakdown: Array<{
    category: string;
    totalSales: number;
    vatCollected: number;
    itemCount: number;
  }>;
  metadata: {
    totalOrders: number;
    totalItems: number;
    generatedAt: string;
  };
}
```

---

## Testing

Example test for rating form:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SellerRatingForm } from '@/components/seller-ratings';

test('submits rating when all categories are filled', async () => {
  const onSuccess = jest.fn();
  
  render(
    <SellerRatingForm
      orderId="order-1"
      vendorId="vendor-1"
      vendorName="Test Vendor"
      onSuccess={onSuccess}
    />
  );
  
  // Click stars for each category
  // ... test implementation
  
  fireEvent.click(screen.getByText('Submit Rating'));
  
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Common Issues

1. **Component not rendering**
   - Check if vendorId is valid
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Ratings not submitting**
   - Ensure user is authenticated
   - Verify order belongs to the user
   - Check all rating fields are filled

3. **Tax report not generating**
   - Verify user has vendor role
   - Check date range is valid
   - Ensure vendor has TIN configured

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:
- Keyboard navigation support
- Screen reader friendly
- Proper ARIA labels
- Sufficient color contrast
- Focus indicators

---

## Performance

Components are optimized for performance:
- Lazy loading of rating lists
- Debounced search/filter (where applicable)
- Memoized calculations
- Efficient re-renders with React hooks

---

For more information, see:
- [API Documentation](./SELLER_RATINGS_AND_TAX_COMPLIANCE.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY_RATINGS_TAX.md)
