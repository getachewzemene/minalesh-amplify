# Advanced E-commerce Features Documentation

This document describes the advanced e-commerce features implemented to bring the Minalesh marketplace to the level of platforms like Amazon, eBay, and Alibaba.

## Table of Contents

1. [Product Detail Page Features](#product-detail-page-features)
2. [Main Page Features](#main-page-features)
3. [Cross-Page Features](#cross-page-features)
4. [API Endpoints](#api-endpoints)
5. [Components Reference](#components-reference)
6. [Configuration](#configuration)

---

## Product Detail Page Features

### 1. Frequently Bought Together

**Location:** Product detail page, after reviews section

**Description:** Shows products commonly purchased together with the current product. Users can select multiple items and add them all to cart at once with combined pricing.

**Features:**
- Automatically recommends up to 4 related products
- Multi-select checkbox interface
- Real-time total price calculation
- Smart product matching based on category and price range
- Displays stock status for each item

**Usage Example:**
```tsx
<FrequentlyBoughtTogether 
  currentProductId={productId}
  currentProduct={{
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image
  }}
/>
```

**API Endpoint:** `GET /api/products/[id]/frequently-bought-together`

---

### 2. Customer Questions & Answers

**Location:** Product detail page, after Frequently Bought Together

**Description:** Amazon-style Q&A section where customers can ask questions about products and get answers from sellers or other customers.

**Features:**
- Ask questions (requires login)
- View existing questions and answers
- Mark answers as helpful
- Real-time question submission
- Pending answer indication

**Usage Example:**
```tsx
<ProductQA productId={product.id} />
```

**API Endpoints:**
- `GET /api/products/[id]/questions` - Retrieve questions
- `POST /api/products/[id]/questions` - Submit a question

---

### 3. Stock Alert Subscription

**Location:** Product detail page, replaces stock status when out of stock

**Description:** Allows customers to subscribe to email notifications when out-of-stock products become available again.

**Features:**
- Email subscription for out-of-stock items
- Works for both logged-in and guest users
- Visual feedback for successful subscription
- Automatically shown only for out-of-stock products

**Usage Example:**
```tsx
<StockAlert 
  productId={product.id}
  productName={product.name}
  isInStock={product.stockQuantity > 0}
/>
```

**API Endpoint:** `POST /api/products/[id]/stock-alert`

---

### 4. Delivery Date Estimator

**Location:** Product detail page, in product info section

**Description:** Calculates estimated delivery dates based on the customer's location within Ethiopia.

**Features:**
- Region-specific delivery estimates
- Supports 10 Ethiopian regions
- Accounts for out-of-stock processing time
- Shows delivery range (earliest to latest)
- Displays shipping origin city
- Standard and express delivery information

**Usage Example:**
```tsx
<DeliveryEstimator
  productId={product.id}
  vendorCity={vendor.city}
  inStock={stockQuantity > 0}
/>
```

**Supported Regions:**
- Addis Ababa (1-3 days)
- Dire Dawa (2-4 days)
- Bahir Dar (3-5 days)
- Gondar (3-5 days)
- Mekelle (3-6 days)
- Hawassa (2-4 days)
- Adama (1-3 days)
- Jimma (3-5 days)
- Dessie (4-6 days)
- Other Regions (5-10 days)

---

### 5. Recently Viewed Products Tracking

**Description:** Automatically tracks products viewed by the user and displays them on various pages.

**Features:**
- Automatic tracking on product view
- Stores last 12 viewed products
- LocalStorage-based persistence
- Cross-tab synchronization
- Prevents duplicates
- Most recent first ordering

**Usage:**

Track a view (automatic in product page):
```tsx
import { trackProductView } from '@/components/product/RecentlyViewedProducts'

trackProductView({
  id: product.id,
  name: product.name,
  price: product.price,
  salePrice: product.salePrice,
  image: product.image
})
```

Display recently viewed:
```tsx
<RecentlyViewedProducts />
```

---

## Main Page Features

### 1. Quick View Modal

**Location:** Homepage product grid (on hover, click eye icon)

**Description:** Preview product details in a modal without leaving the current page.

**Features:**
- Full product information display
- Image gallery with thumbnails
- Add to cart/wishlist from modal
- View full details button
- Mobile-responsive design
- Loading states

**Usage Example:**
```tsx
const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null)
const [quickViewOpen, setQuickViewOpen] = useState(false)

<QuickViewModal 
  productId={quickViewProduct}
  isOpen={quickViewOpen}
  onClose={() => {
    setQuickViewOpen(false)
    setQuickViewProduct(null)
  }}
/>
```

---

### 2. Smart Product Badges

**Location:** All product cards on homepage and product listing pages

**Description:** Dynamic badges that automatically display based on product attributes and performance.

**Badge Types:**
- **Best Seller** - Products with 50+ sales
- **Trending** - Products with 100+ recent views
- **New** - Products added within last 30 days
- **Limited Stock** - 5 or fewer items remaining (animated)
- **Low Stock** - 6-10 items remaining
- **Highly Rated** - Rating 4.5 or above
- **SALE** - Products with active discounts

**Usage Example:**
```tsx
import { ProductBadges, getProductBadges } from '@/components/product/ProductBadges'

<ProductBadges
  {...getProductBadges({
    createdAt: product.createdAt,
    stockQuantity: product.stockQuantity,
    salePrice: product.salePrice,
    price: product.price,
    ratingAverage: product.ratingAverage,
    salesCount: product.salesCount,
    viewCount: product.viewCount
  })}
/>
```

---

## Cross-Page Features

### Product Comparison

**Description:** Compare up to 4 products side-by-side with detailed specifications.

**Features:**
- Compare prices, ratings, specifications
- View all product images
- Quick navigation to product pages
- Supports custom specifications
- Mobile-responsive table layout
- LocalStorage persistence

**Usage Example:**
```tsx
import { ProductComparison, useProductComparison } from '@/components/product/ProductComparison'

function MyComponent() {
  const {
    compareProducts,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    openCompare,
    closeCompare
  } = useProductComparison()

  return (
    <>
      <Button onClick={() => addToCompare(productId)}>
        Compare
      </Button>
      
      <ProductComparison
        isOpen={isCompareOpen}
        onClose={closeCompare}
        products={compareProducts}
      />
    </>
  )
}
```

---

## API Endpoints

### Frequently Bought Together

```
GET /api/products/[id]/frequently-bought-together
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod-123",
      "name": "Product Name",
      "price": 1000,
      "salePrice": 800,
      "images": ["image1.jpg"],
      "stockQuantity": 10,
      "ratingAverage": 4.5,
      "ratingCount": 25
    }
  ]
}
```

---

### Product Questions

**Get Questions:**
```
GET /api/products/[id]/questions
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-123",
      "question": "What is the warranty?",
      "answer": "1 year manufacturer warranty",
      "userName": "Customer Name",
      "createdAt": "2024-01-15T10:00:00Z",
      "answeredAt": "2024-01-16T14:30:00Z",
      "helpfulCount": 5,
      "isHelpful": false
    }
  ]
}
```

**Post Question:**
```
POST /api/products/[id]/questions
Content-Type: application/json
Authorization: Bearer {token}

{
  "question": "What is the warranty period?"
}
```

---

### Stock Alerts

```
POST /api/products/[id]/stock-alert
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to stock alerts"
}
```

---

## Components Reference

### Component Locations

All new components are located in `/src/components/product/`:

- `FrequentlyBoughtTogether.tsx`
- `ProductQA.tsx`
- `StockAlert.tsx`
- `QuickViewModal.tsx`
- `RecentlyViewedProducts.tsx`
- `ProductComparison.tsx`
- `ProductBadges.tsx`
- `DeliveryEstimator.tsx`

### Shared Constants

All configurable constants are centralized in `/src/lib/product-constants.ts`:

```typescript
export const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'recently_viewed_products',
  COMPARE_PRODUCTS: 'compare_products'
}

export const PRODUCT_LIMITS = {
  MAX_COMPARISON: 4,
  MAX_RECENTLY_VIEWED: 12,
  MAX_FREQUENTLY_BOUGHT: 4
}

export const BADGE_THRESHOLDS = {
  BEST_SELLER_SALES: 50,
  TRENDING_VIEWS: 100,
  LOW_STOCK: 10,
  LIMITED_STOCK: 5,
  HIGHLY_RATED: 4.5
}

export const DEFAULTS = {
  PLACEHOLDER_IMAGE: '/placeholder-product.jpg'
}
```

---

## Configuration

### Customizing Badge Thresholds

Edit `/src/lib/product-constants.ts`:

```typescript
export const BADGE_THRESHOLDS = {
  BEST_SELLER_SALES: 100,  // Change from 50 to 100
  TRENDING_VIEWS: 200,      // Change from 100 to 200
  // ...
}
```

### Customizing Product Limits

```typescript
export const PRODUCT_LIMITS = {
  MAX_COMPARISON: 6,        // Change from 4 to 6
  MAX_RECENTLY_VIEWED: 20,  // Change from 12 to 20
  // ...
}
```

### Adding New Regions to Delivery Estimator

Edit `/src/components/product/DeliveryEstimator.tsx`:

```typescript
const ETHIOPIAN_REGIONS = [
  // ... existing regions
  { name: "New Region", days: { min: 3, max: 7 } }
]
```

---

## Best Practices

1. **Performance**: Components use lazy loading and proper React optimization
2. **Accessibility**: All components follow WCAG guidelines with proper ARIA labels
3. **Mobile-First**: All features are responsive and touch-friendly
4. **Error Handling**: Graceful degradation when APIs fail
5. **Caching**: LocalStorage used appropriately with size limits
6. **Security**: All user input is validated and sanitized

---

## Future Enhancements

Potential improvements for future versions:

1. **Price History Graph** - Track and display historical pricing
2. **Customer Photos/Videos** - User-generated content gallery
3. **360-Degree View** - Interactive product rotation
4. **Size/Fit Guide** - Interactive sizing assistance
5. **Social Share** - Enhanced sharing capabilities
6. **Live Shopping Feed** - Real-time purchase notifications
7. **Price Drop Alerts** - Notification system for price changes

---

## Support

For issues or questions about these features:
- Check the component documentation in source files
- Review API endpoint responses
- Verify configuration in product-constants.ts
- Ensure all dependencies are properly installed
