# Search Backend Documentation

## Overview

The search backend implements PostgreSQL full-text search with trigram similarity indexing for efficient product queries. This provides better performance and relevance than basic string matching.

## Features

### Full-Text Search
- PostgreSQL `pg_trgm` extension for trigram-based similarity search
- GIN indexes on product name, description, and short description
- Case-insensitive search across multiple fields
- Relevance-based ranking

### Faceted Filtering
- **Category**: Filter by product category (slug or ID)
- **Price Range**: Min/max price filters
- **Rating**: Minimum rating filter
- **Vendor**: Filter by vendor name or ID
- **Location**: Filter by vendor city
- **Stock Status**: In-stock only filter
- **Verification**: Verified vendors only filter
- **Featured**: Featured products filter

### Search Sorting
- **Relevance**: Best match based on featured status, view count, and rating
- **Price**: Low to high or high to low
- **Rating**: Highest rated first
- **Newest**: Recently added products
- **Popular**: Most sold products

## API Endpoints

### Product Search
```bash
GET /api/products/search
```

**Query Parameters:**
- `search` - Search query string
- `category` - Category slug
- `min_price` - Minimum price
- `max_price` - Maximum price
- `rating` - Minimum rating (1-5)
- `vendor` - Vendor name
- `location` - City/location
- `in_stock` - Filter in-stock items (true/false)
- `verified` - Verified vendors only (true/false)
- `sort` - Sort by: relevance, price_low, price_high, rating, newest, popular
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20, max: 100)

**Example Request:**
```bash
curl "http://localhost:3000/api/products/search?search=laptop&min_price=500&max_price=2000&rating=4&sort=price_low&page=1"
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": "999.99",
      "ratingAverage": "4.5",
      "vendor": {
        "displayName": "Vendor Name",
        "vendorStatus": "approved"
      },
      "category": {
        "name": "Electronics",
        "slug": "electronics"
      },
      "media": [
        {
          "id": "uuid",
          "url": "https://...",
          "altText": "Product image",
          "optimizedVersions": {
            "thumbnail": { "url": "...", "width": 150, "height": 150 },
            "medium": { "url": "...", "width": 500, "height": 500 }
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Search Suggestions
```bash
GET /api/search/suggestions?q={query}&limit=10
```

Returns autocomplete suggestions based on product names.

**Example:**
```bash
curl "http://localhost:3000/api/search/suggestions?q=lap&limit=5"
```

**Response:**
```json
{
  "suggestions": [
    "Laptop Dell Inspiron",
    "Laptop HP Pavilion",
    "Laptop Charger",
    "Laptop Bag",
    "Laptop Stand"
  ]
}
```

### Search Facets
```bash
GET /api/search/facets?search={query}&category={slug}
```

Returns aggregated data for dynamic filter options.

**Response:**
```json
{
  "success": true,
  "facets": {
    "priceRange": {
      "min": 50,
      "max": 5000
    },
    "categories": [
      { "categoryId": "uuid", "_count": 15 }
    ],
    "ratings": [
      { "ratingAverage": "4.5", "_count": 23 }
    ]
  }
}
```

## Database Schema

### Indexes
The following indexes are created for optimal search performance:

```sql
-- Trigram indexes for full-text search
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);
CREATE INDEX products_description_trgm_idx ON products USING GIN (description gin_trgm_ops);
CREATE INDEX products_short_description_trgm_idx ON products USING GIN (short_description gin_trgm_ops);

-- Composite index for common filters
CREATE INDEX products_search_idx ON products(is_active, price, rating_average, created_at);
```

## Implementation Details

### Search Utility (`src/lib/search.ts`)

The search utility provides:
- `searchProducts(options)` - Main search function with filtering and pagination
- `getSearchFacets(filters)` - Get aggregated filter data
- `getSearchSuggestions(query, limit)` - Get autocomplete suggestions

### Search Algorithm

1. **Query Processing**: Clean and normalize search query
2. **Filter Building**: Construct Prisma where clause based on filters
3. **Sorting**: Apply sort order (relevance uses multi-field sorting)
4. **Pagination**: Calculate skip/take for page navigation
5. **Execution**: Run query with includes for vendor, category, and media
6. **Response**: Return products with pagination metadata

### Relevance Ranking

When sorting by relevance:
1. Featured products appear first
2. Then sorted by view count (popularity)
3. Then by rating average
4. Falls back to creation date if no query

## Performance Considerations

- GIN indexes provide fast text search on large datasets
- Trigram similarity is more efficient than LIKE queries
- Composite indexes optimize common filter combinations
- Pagination limits result set size
- Includes are selective to minimize data transfer

## Usage in Frontend

```typescript
// Basic search
const results = await fetch('/api/products/search?search=coffee');

// Advanced search with filters
const results = await fetch('/api/products/search?' + new URLSearchParams({
  search: 'coffee',
  category: 'coffee-tea',
  min_price: '100',
  max_price: '500',
  rating: '4',
  verified: 'true',
  sort: 'price_low',
  page: '1',
  per_page: '20'
}));

// Get suggestions for autocomplete
const suggestions = await fetch('/api/search/suggestions?q=cof&limit=5');

// Get facets for filter UI
const facets = await fetch('/api/search/facets?search=coffee');
```

## Migration

To enable the search backend, run the migration:

```bash
npx prisma migrate dev
```

This will:
1. Enable the `pg_trgm` extension
2. Create necessary GIN indexes
3. Set up the optimized search infrastructure

## Future Enhancements

- Advanced search operators (AND, OR, NOT)
- Synonym support
- Spell correction
- Search analytics
- Personalized search results
- Machine learning-based ranking
