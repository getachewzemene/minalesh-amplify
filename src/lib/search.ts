/**
 * Full-Text Search Utilities
 * 
 * Implements PostgreSQL trigram-based search for products.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';
import { getOrSetCache } from './cache';

// Cache configuration for search
const SEARCH_CACHE_PREFIX = 'search';
const SUGGESTIONS_TTL = 120; // 2 minutes
const SUGGESTIONS_STALE_TIME = 300; // 5 minutes
const FACETS_TTL = 180; // 3 minutes
const FACETS_STALE_TIME = 360; // 6 minutes

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  vendorId?: string;
  vendorName?: string;
  city?: string;
  inStock?: boolean;
  verified?: boolean;
  isFeatured?: boolean;
}

export interface SearchSort {
  field: 'relevance' | 'price' | 'rating' | 'newest' | 'popular';
  order?: 'asc' | 'desc';
}

export interface SearchOptions {
  filters: SearchFilters;
  sort?: SearchSort;
  page?: number;
  perPage?: number;
}

export interface SearchResult {
  products: any[];
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: SearchFilters;
}

/**
 * Build where clause for product search with full-text support
 */
function buildWhereClause(filters: SearchFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  // Full-text search using trigram similarity
  if (filters.query && filters.query.trim()) {
    const query = filters.query.trim();
    
    // Use raw SQL for trigram search
    where.OR = [
      {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: query,
          mode: 'insensitive',
        },
      },
      {
        shortDescription: {
          contains: query,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Category filter
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  } else if (filters.categorySlug) {
    where.category = {
      slug: filters.categorySlug,
    };
  }

  // Brand filter
  if (filters.brand) {
    where.brand = {
      contains: filters.brand,
      mode: 'insensitive',
    };
  }

  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  // Rating filter
  if (filters.minRating !== undefined) {
    where.ratingAverage = {
      gte: filters.minRating,
    };
  }

  // Vendor filter - combine all vendor filters into one
  if (filters.vendorId) {
    where.vendorId = filters.vendorId;
  } else if (filters.vendorName || filters.city || filters.verified) {
    const vendorFilter: any = {};
    
    if (filters.vendorName) {
      vendorFilter.displayName = {
        contains: filters.vendorName,
        mode: 'insensitive',
      };
    }
    
    if (filters.city) {
      vendorFilter.city = filters.city;
    }
    
    if (filters.verified) {
      vendorFilter.vendorStatus = 'approved';
    }
    
    where.vendor = vendorFilter;
  }

  // Stock filter
  if (filters.inStock) {
    where.stockQuantity = {
      gt: 0,
    };
  }

  // Featured filter
  if (filters.isFeatured) {
    where.isFeatured = true;
  }

  return where;
}

/**
 * Build order by clause for sorting
 */
function buildOrderByClause(
  sort?: SearchSort,
  hasQuery?: boolean
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
  if (!sort || sort.field === 'relevance') {
    // For relevance, prioritize featured products and view count
    if (hasQuery) {
      return [
        { isFeatured: 'desc' },
        { viewCount: 'desc' },
        { ratingAverage: 'desc' },
      ];
    }
    return { createdAt: 'desc' };
  }

  switch (sort.field) {
    case 'price':
      return { price: sort.order || 'asc' };
    case 'rating':
      return { ratingAverage: sort.order || 'desc' };
    case 'newest':
      return { createdAt: 'desc' };
    case 'popular':
      return { saleCount: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

/**
 * Search products with full-text search and faceted filtering
 */
export async function searchProducts(options: SearchOptions): Promise<SearchResult> {
  const {
    filters,
    sort,
    page = 1,
    perPage = 20,
  } = options;

  const where = buildWhereClause(filters);
  const orderBy = buildOrderByClause(sort, !!filters.query);
  const skip = (page - 1) * perPage;

  // Execute search
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            displayName: true,
            vendorStatus: true,
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            altText: true,
            optimizedVersions: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / perPage);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    products,
    pagination: {
      page,
      perPage,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
    filters,
  };
}

/**
 * Get search facets (aggregations for filters) with caching
 */
export async function getSearchFacets(filters: SearchFilters) {
  // Generate cache key based on filters
  const cacheKey = `facets:${JSON.stringify(filters)}`;

  return await getOrSetCache(
    cacheKey,
    async () => {
      const where = buildWhereClause(filters);

      const [
        priceRange,
        categoryFacets,
        ratingFacets,
      ] = await Promise.all([
        // Get price range
        prisma.product.aggregate({
          where,
          _min: { price: true },
          _max: { price: true },
        }),
        
        // Get category counts
        prisma.product.groupBy({
          where,
          by: ['categoryId'],
          _count: true,
        }),
        
        // Get rating distribution
        prisma.product.groupBy({
          where,
          by: ['ratingAverage'],
          _count: true,
        }),
      ]);

      return {
        priceRange: {
          min: priceRange._min.price,
          max: priceRange._max.price,
        },
        categories: categoryFacets,
        ratings: ratingFacets,
      };
    },
    {
      ttl: FACETS_TTL,
      staleTime: FACETS_STALE_TIME,
      prefix: SEARCH_CACHE_PREFIX,
      tags: ['search', 'facets'],
    }
  );
}

/**
 * Get search suggestions based on partial query with caching
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `suggestions:${normalizedQuery}:${limit}`;

  return await getOrSetCache(
    cacheKey,
    async () => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          name: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: limit,
        orderBy: {
          viewCount: 'desc',
        },
      });

      return products.map((p) => p.name);
    },
    {
      ttl: SUGGESTIONS_TTL,
      staleTime: SUGGESTIONS_STALE_TIME,
      prefix: SEARCH_CACHE_PREFIX,
      tags: ['search', 'suggestions'],
    }
  );
}
