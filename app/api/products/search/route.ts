import { NextResponse } from 'next/server';
import { searchProducts, SearchFilters, SearchSort } from '@/lib/search';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products
 *     description: Search and filter products with full-text search and faceted filtering
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Product brand
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *         description: Vendor name
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: City/location
 *       - in: query
 *         name: in_stock
 *         schema:
 *           type: boolean
 *         description: Only in-stock items
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, price_low, price_high, rating, newest, popular]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract and build filters
  const filters: SearchFilters = {
    query: searchParams.get('search') || undefined,
    categorySlug: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: searchParams.get('min_price') 
      ? parseFloat(searchParams.get('min_price')!)
      : undefined,
    maxPrice: searchParams.get('max_price')
      ? parseFloat(searchParams.get('max_price')!)
      : undefined,
    minRating: searchParams.get('rating')
      ? parseFloat(searchParams.get('rating')!)
      : undefined,
    vendorName: searchParams.get('vendor') || undefined,
    city: searchParams.get('location') || undefined,
    inStock: searchParams.get('in_stock') === 'true',
    verified: searchParams.get('verified') === 'true',
  };

  // Extract sort parameters
  const sortParam = searchParams.get('sort') || 'relevance';
  let sort: SearchSort = { field: 'relevance' };
  
  switch (sortParam) {
    case 'price_low':
      sort = { field: 'price', order: 'asc' };
      break;
    case 'price_high':
      sort = { field: 'price', order: 'desc' };
      break;
    case 'rating':
      sort = { field: 'rating', order: 'desc' };
      break;
    case 'newest':
      sort = { field: 'newest' };
      break;
    case 'popular':
      sort = { field: 'popular' };
      break;
    default:
      sort = { field: 'relevance' };
  }

  // Extract pagination
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 100);

  // Generate cache key based on search parameters
  const cacheKey = `search:${JSON.stringify({ filters, sort, page, perPage })}`;

  // Execute search with caching (5 minute TTL, 10 minute stale)
  const result = await getOrSetCache(
    cacheKey,
    async () => {
      return await searchProducts({
        filters,
        sort,
        page,
        perPage,
      });
    },
    {
      ttl: 300, // 5 minutes
      staleTime: 600, // 10 minutes stale-while-revalidate
      prefix: 'products',
      tags: ['products', 'search'],
    }
  );

  const response = NextResponse.json({
    products: result.products,
    pagination: result.pagination,
    filters: {
      query: filters.query,
      category: filters.categorySlug,
      brand: filters.brand,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      rating: filters.minRating,
      vendor: filters.vendorName,
      location: filters.city,
      inStock: filters.inStock,
      verified: filters.verified,
      sort: sortParam,
    },
  });

  // Add cache headers for CDN and browser caching
  // stale-while-revalidate: serve stale content while revalidating in background
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=600'
  );

  return response;
}

// Export with rate limiting, API logging and error handling
export const GET = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.productList)
);
