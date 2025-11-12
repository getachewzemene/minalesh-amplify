import { NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/search';

/**
 * Get search suggestions based on partial query
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        suggestions: [],
      });
    }

    const suggestions = await getSearchSuggestions(query, limit);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return NextResponse.json(
      { error: 'An error occurred while getting suggestions' },
      { status: 500 }
    );
  }
}
