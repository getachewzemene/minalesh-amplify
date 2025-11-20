# Product Discovery Quick Start Guide

A quick guide to implementing product recommendations, top products, and new arrivals in your pages.

## 🚀 Quick Integration

### 1. Homepage Sections

```tsx
import { ProductSection } from '@/components/product-section'

export default function Home() {
  return (
    <main>
      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        description="Discover the latest products"
        endpoint="/api/products/new"
        limit={8}
        showViewAll={true}
        viewAllLink="/products?sort=newest"
      />

      {/* Top Products */}
      <ProductSection
        title="Top Products"
        description="Best-selling items from verified vendors"
        endpoint="/api/products/top"
        limit={8}
        showViewAll={true}
        viewAllLink="/products?sort=popular"
      />

      {/* Personalized (logged in only) */}
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

### 2. Product Detail Page - Similar Products

```tsx
// app/product/[id]/page.tsx
import { ProductSection } from '@/components/product-section'

export default function ProductDetail({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Product details */}
      
      {/* Similar products */}
      <ProductSection
        title="You May Also Like"
        endpoint="/api/products/recommendations"
        productId={params.id}
        limit={4}
      />
    </div>
  )
}
```

### 3. Category Page - Top in Category

```tsx
// app/products/[category]/page.tsx
import { ProductSection } from '@/components/product-section'

export default function CategoryPage({ params }: { params: { category: string } }) {
  return (
    <div>
      <ProductSection
        title="Top Products"
        endpoint="/api/products/top"
        categorySlug={params.category}
        limit={12}
      />
    </div>
  )
}
```

## 📡 Direct API Usage

### Fetch Top Products

```typescript
const response = await fetch('/api/products/top?limit=10&category=electronics')
const { products } = await response.json()
```

### Fetch New Products

```typescript
const response = await fetch('/api/products/new?limit=8&days=7')
const { products } = await response.json()
```

### Fetch Recommendations

```typescript
// Personalized (with auth token)
const response = await fetch('/api/products/recommendations?limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { products } = await response.json()

// Similar products (no auth needed)
const response = await fetch(`/api/products/recommendations?productId=${id}&limit=8`)
const { products } = await response.json()
```

## 🎨 Custom Styling

The `ProductSection` component uses Tailwind CSS and shadcn/ui. You can customize by:

1. **Modify the component** in `src/components/product-section.tsx`
2. **Use Tailwind classes** on the wrapper:

```tsx
<div className="bg-gray-50 py-16">
  <ProductSection {...props} />
</div>
```

3. **Create a custom wrapper**:

```tsx
export function CustomProductSection(props) {
  return (
    <section className="container mx-auto my-custom-styles">
      <ProductSection {...props} />
    </section>
  )
}
```

## 🔧 API Parameters

### All Endpoints Support

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 10 | 50 | Number of products to return |
| `category` | string | - | - | Filter by category slug |

### New Products Only

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Products added within last N days |

### Recommendations Only

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | string | Get similar products (no auth required) |

## 💡 Use Cases

### E-commerce Homepage
```tsx
<HeroSection />
<FeaturedProducts />      {/* Static/curated */}
<NewArrivals />          {/* Last 7 days */}
<TopProducts />          {/* Best sellers */}
<PersonalizedForYou />   {/* If logged in */}
```

### Product Detail Page
```tsx
<ProductInfo />
<ProductReviews />
<SimilarProducts />      {/* Based on current product */}
<RecentlyViewed />       {/* Could add this feature */}
```

### Category Page
```tsx
<CategoryBanner />
<TopInCategory />        {/* Filter by category */}
<NewInCategory />        {/* Filter by category */}
<AllProducts />          {/* Paginated list */}
```

### Search Results Page
```tsx
<SearchResults />
<RelatedProducts />      {/* Based on search term */}
<TopProducts />          {/* Popular alternatives */}
```

## 🎯 Best Practices

1. **Use appropriate limits:**
   - Homepage sections: 8 products
   - Similar products: 4-6 products
   - Category pages: 12+ products

2. **Show personalized content conditionally:**
   ```tsx
   {user && <PersonalizedSection />}
   ```

3. **Provide fallbacks:**
   - The recommendation API automatically falls back to popular products
   - Handle empty states in your UI

4. **Cache considerations:**
   - Endpoints are cached by default
   - Personalized recommendations use private cache
   - Cache keys include parameters (limit, category, etc.)

5. **Mobile-first:**
   - ProductSection is responsive by default
   - Grid adjusts: 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop)

## 🔍 Debugging

### Check API Response

```bash
# Browser DevTools Network tab
curl http://localhost:3000/api/products/top?limit=5

# Expected response
{
  "products": [...]
}
```

### Common Issues

**No products returned:**
- Check database has products with `isActive=true` and `stockQuantity > 0`
- Verify products exist in the requested category
- For new products, check they're within the date range

**Recommendations not personalized:**
- User needs order history or wishlist items
- System falls back to popular products (this is normal)

**Slow loading:**
- Check cache is working (look for cache headers)
- Verify database indexes exist
- Consider reducing `limit` parameter

## 📚 Full Documentation

For complete API reference, implementation details, and advanced usage:
- **[Product Recommendations Documentation](./PRODUCT_RECOMMENDATIONS.md)**
- **[API Documentation](http://localhost:3000/api-docs)** (when running dev server)

## 🚀 Next Steps

1. Implement on homepage ✅
2. Add similar products to product detail page
3. Create category-specific sections
4. Track analytics on recommendations
5. A/B test different section orders
6. Add "Recently Viewed" feature
7. Implement real-time trending products

## 💻 Example Repository Structure

```
app/
├── page.tsx                    # Homepage with sections
├── product/[id]/
│   └── page.tsx               # Product detail with similar
└── products/
    ├── page.tsx               # All products
    └── [category]/
        └── page.tsx           # Category with top products

src/components/
└── product-section.tsx        # Reusable component

app/api/products/
├── top/route.ts              # Top products API
├── new/route.ts              # New products API
└── recommendations/route.ts   # Recommendations API
```

## 🎓 Learning Resources

- **Next.js App Router**: [Documentation](https://nextjs.org/docs/app)
- **Prisma ORM**: [Documentation](https://www.prisma.io/docs)
- **React Query**: Already integrated via TanStack Query
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/docs)

---

Happy coding! 🎉 For questions or issues, refer to the main documentation or open a GitHub issue.
