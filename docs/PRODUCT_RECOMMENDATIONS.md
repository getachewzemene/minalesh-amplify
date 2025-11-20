# Product Recommendations, Top Products, and New Products

This document describes the product discovery features that help customers find relevant products on the Minalesh marketplace.

## Overview

Three new API endpoints provide different ways to discover products:

1. **Top Products** - Most popular and best-selling items
2. **New Products** - Recently added items to the marketplace
3. **Product Recommendations** - Personalized suggestions based on user behavior

## API Endpoints

### 1. Top Products

Get the most popular products based on sales count, view count, and ratings.

**Endpoint:** `GET /api/products/top`

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10, max: 50)
- `category` (optional): Filter by category slug

**Example Request:**
```bash
GET /api/products/top?limit=8&category=electronics
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro Max",
      "price": 89999.00,
      "salePrice": null,
      "ratingAverage": 4.8,
      "ratingCount": 256,
      "stockQuantity": 15,
      "saleCount": 142,
      "viewCount": 5234,
      "images": [...],
      "category": {
        "name": "Smartphones",
        "slug": "smartphones"
      },
      "vendor": {
        "displayName": "TechStore ET",
        "isVendor": true,
        "city": "Addis Ababa"
      }
    }
  ]
}
```

**Sorting Logic:**
Products are sorted by:
1. Sales count (descending)
2. View count (descending)
3. Rating average (descending)

**Cache:** 10 minutes TTL, 30 minutes stale-while-revalidate

---

### 2. New Products

Get recently added products to the marketplace.

**Endpoint:** `GET /api/products/new`

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10, max: 50)
- `category` (optional): Filter by category slug
- `days` (optional): Products added within the last N days (default: 30)

**Example Request:**
```bash
GET /api/products/new?limit=8&days=7
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Samsung Galaxy S24",
      "price": 79999.00,
      "createdAt": "2025-11-18T10:30:00Z",
      "stockQuantity": 25,
      "images": [...],
      "category": {
        "name": "Smartphones",
        "slug": "smartphones"
      },
      "vendor": {
        "displayName": "Mobile World",
        "isVendor": true
      }
    }
  ]
}
```

**Filtering Logic:**
- Only products created within the specified time window
- Only active products with stock
- Sorted by creation date (newest first)

**Cache:** 5 minutes TTL, 15 minutes stale-while-revalidate

---

### 3. Product Recommendations

Get personalized product recommendations or similar products.

**Endpoint:** `GET /api/products/recommendations`

**Authentication:** Optional (works for both authenticated and anonymous users)

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10, max: 50)
- `productId` (optional): Get similar products to this product ID

**Example Requests:**

**Similar Products (no authentication required):**
```bash
GET /api/products/recommendations?productId=uuid&limit=8
```

**Personalized Recommendations (authentication required):**
```bash
GET /api/products/recommendations?limit=10
Authorization: Bearer <jwt-token>
```

**Anonymous User:**
```bash
GET /api/products/recommendations?limit=8
```

**Response:**
```json
{
  "products": [...]
}
```

**Recommendation Logic:**

1. **Similar Products Mode** (when `productId` is provided):
   - Finds products in the same category
   - Similar price range (±30%)
   - Sorted by rating and sales count

2. **Personalized Mode** (authenticated user, no `productId`):
   - Analyzes user's order history (last 10 orders)
   - Analyzes user's wishlist (last 20 items)
   - Identifies preferred categories
   - Recommends products from those categories
   - Sorted by rating and sales count
   - Falls back to popular products if no history

3. **Anonymous Mode** (no authentication, no `productId`):
   - Returns popular products
   - Sorted by view count and rating

**Cache:**
- Personalized: 5 minutes TTL (private cache)
- Similar/Anonymous: 10 minutes TTL (public cache)
- All: stale-while-revalidate enabled

---

## UI Components

### ProductSection Component

A reusable React component for displaying product collections.

**Usage:**
```tsx
import { ProductSection } from '@/components/product-section'

// Top Products Section
<ProductSection
  title="Top Products"
  description="Best-selling and most popular items"
  endpoint="/api/products/top"
  limit={8}
  showViewAll={true}
  viewAllLink="/products?sort=popular"
/>

// New Arrivals Section
<ProductSection
  title="New Arrivals"
  description="Discover the latest products"
  endpoint="/api/products/new"
  limit={8}
  showViewAll={true}
  viewAllLink="/products?sort=newest"
/>

// Personalized Recommendations
<ProductSection
  title="Recommended for You"
  description="Based on your interests"
  endpoint="/api/products/recommendations"
  limit={8}
  showViewAll={false}
/>

// Similar Products (on product detail page)
<ProductSection
  title="Similar Products"
  endpoint="/api/products/recommendations"
  productId={currentProductId}
  limit={4}
/>
```

**Props:**
- `title` (string): Section heading
- `description` (string, optional): Section description
- `endpoint` (string): API endpoint to fetch products
- `limit` (number, optional): Number of products to display (default: 8)
- `categorySlug` (string, optional): Filter by category
- `productId` (string, optional): For similar product recommendations
- `showViewAll` (boolean, optional): Show "View All" button
- `viewAllLink` (string, optional): Link for "View All" button

**Features:**
- Loading states with skeleton placeholders
- Hover effects for product cards
- Quick add to cart/wishlist buttons
- Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
- Click to view product details

---

## Implementation Details

### Database Queries

All endpoints use efficient Prisma queries with:
- Proper indexes on `saleCount`, `viewCount`, `createdAt`, `ratingAverage`
- Limited result sets (max 50)
- Selective field inclusion
- Active product filtering
- Stock availability checking

### Performance Optimization

1. **Caching Strategy:**
   - In-memory cache with configurable TTL
   - Stale-while-revalidate for better UX
   - Cache key generation based on parameters
   - Cache invalidation on product updates

2. **Rate Limiting:**
   - Uses existing rate limit infrastructure
   - `productList` rate limit config

3. **API Logging:**
   - Request/response logging
   - Performance metrics
   - Error tracking

### Security

- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection protection via Prisma
- Authentication optional but respected
- No sensitive data exposure

### Price Range Calculation (Similar Products)

For finding similar products by price:
```typescript
const minPrice = product.price * 0.7  // -30%
const maxPrice = product.price * 1.3  // +30%
```

This creates a reasonable price range for similar products while maintaining relevance.

---

## Testing

Comprehensive test coverage in `src/__tests__/product-features.test.ts`:

- Parameter validation (limit, days, category)
- Date calculation accuracy
- Price range tolerance
- Cache configuration
- Response structure
- Sorting criteria
- Filtering logic

Run tests:
```bash
npm test src/__tests__/product-features.test.ts
```

---

## Usage Examples

### Homepage Integration

The homepage displays all three types of product sections:

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main>
      <HeroSection />
      
      {/* Featured Products (existing) */}
      <ProductGrid />
      
      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        description="Discover the latest products"
        endpoint="/api/products/new"
        limit={8}
        showViewAll={true}
      />

      {/* Top Products */}
      <ProductSection
        title="Top Products"
        description="Best-selling items"
        endpoint="/api/products/top"
        limit={8}
        showViewAll={true}
      />

      {/* Personalized (logged in users only) */}
      {user && (
        <ProductSection
          title="Recommended for You"
          description="Based on your interests"
          endpoint="/api/products/recommendations"
          limit={8}
        />
      )}
    </main>
  )
}
```

### Product Detail Page Integration

Show similar products on the product detail page:

```tsx
// app/product/[id]/page.tsx
<ProductSection
  title="You May Also Like"
  endpoint="/api/products/recommendations"
  productId={productId}
  limit={4}
/>
```

### Category Page Integration

Show top products in a specific category:

```tsx
// app/products/[category]/page.tsx
<ProductSection
  title="Top Products in {categoryName}"
  endpoint="/api/products/top"
  categorySlug={categorySlug}
  limit={8}
/>
```

---

## Future Enhancements

Potential improvements for the recommendation system:

1. **Machine Learning:**
   - Collaborative filtering
   - Content-based filtering
   - Hybrid recommendation models

2. **Advanced Personalization:**
   - User browsing sessions tracking
   - Click-through rate analysis
   - A/B testing for recommendations

3. **Real-time Updates:**
   - WebSocket for live product updates
   - Real-time trending products

4. **Additional Filters:**
   - Price range preferences
   - Preferred vendors
   - Location-based recommendations

5. **Analytics:**
   - Track recommendation click-through rates
   - Measure conversion rates
   - Optimize recommendation algorithms

---

## Troubleshooting

### No products returned

**Cause:** No products match the criteria
**Solution:** Check that products exist with:
- `isActive = true`
- `stockQuantity > 0`
- Created within the specified time window (for new products)

### Slow response times

**Cause:** Cache miss or database query performance
**Solution:**
- Verify cache is working: Check logs for cache hits/misses
- Add database indexes if needed
- Adjust cache TTL values

### Recommendations not personalized

**Cause:** User has no order history or wishlist items
**Solution:** This is expected behavior - system falls back to popular products

---

## API Reference Summary

| Endpoint | Method | Auth | Cache | Purpose |
|----------|--------|------|-------|---------|
| `/api/products/top` | GET | No | 10m/30m | Popular products |
| `/api/products/new` | GET | No | 5m/15m | Recent products |
| `/api/products/recommendations` | GET | Optional | 5-10m | Personalized/similar |

**Cache Format:** `TTL/Stale-while-revalidate`

All endpoints support:
- Pagination via `limit` parameter
- Category filtering via `category` parameter
- Rate limiting
- API logging
- Swagger documentation
