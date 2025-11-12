import { NextResponse } from 'next/server';
import { getSearchFacets, SearchFilters } from '@/lib/search';

/**
 * Get search facets (aggregations for filters)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filters
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

    const facets = await getSearchFacets(filters);

    return NextResponse.json({
      success: true,
      facets,
    });
  } catch (error) {
    console.error('Error getting search facets:', error);
    return NextResponse.json(
      { error: 'An error occurred while getting facets' },
      { status: 500 }
    );
  }
}
