import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const rating = searchParams.get('rating');
    const vendor = searchParams.get('vendor');
    const location = searchParams.get('location');
    const inStock = searchParams.get('in_stock');
    const hasAR = searchParams.get('has_ar');
    const verified = searchParams.get('verified');
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 100);

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Search query - search in name and description
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = {
        slug: category,
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Rating filter
    if (rating) {
      where.ratingAverage = {
        gte: parseFloat(rating),
      };
    }

    // Vendor filter
    if (vendor) {
      where.vendor = {
        displayName: { contains: vendor, mode: 'insensitive' },
      };
    }

    // Location filter
    if (location) {
      where.vendor = {
        ...where.vendor,
        city: location,
      };
    }

    // In stock filter
    if (inStock === 'true') {
      where.stockQuantity = {
        gt: 0,
      };
    }

    // Verified vendors only filter
    if (verified === 'true') {
      where.vendor = {
        ...where.vendor,
        vendorStatus: 'approved',
      };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { ratingAverage: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        // Relevance - if query exists, prioritize by name match
        if (query) {
          orderBy = [
            { isFeatured: 'desc' },
            { viewCount: 'desc' },
          ];
        } else {
          orderBy = { createdAt: 'desc' };
        }
    }

    // Calculate pagination
    const skip = (page - 1) * perPage;

    // Execute query
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              displayName: true,
              vendorStatus: true,
              city: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      products,
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        query,
        category,
        minPrice,
        maxPrice,
        rating,
        vendor,
        location,
        inStock,
        hasAR,
        verified,
        sort,
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
