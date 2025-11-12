import { NextResponse } from 'next/server';
import { searchProducts, SearchFilters, SearchSort } from '@/lib/search';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract and build filters
    const filters: SearchFilters = {
      query: searchParams.get('search') || undefined,
      categorySlug: searchParams.get('category') || undefined,
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

    // Execute search using new search utility
    const result = await searchProducts({
      filters,
      sort,
      page,
      perPage,
    });

    return NextResponse.json({
      products: result.products,
      pagination: result.pagination,
      filters: {
        query: filters.query,
        category: filters.categorySlug,
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
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching products' },
      { status: 500 }
    );
  }
}
