import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createSavedSearchDigestEmail } from '@/lib/email';
import { searchProducts, SearchFilters } from '@/lib/search';

/**
 * GET /api/cron/process-saved-search-digest
 *
 * Cron job to send email digests of new matching products for saved searches
 *
 * Should be scheduled to run daily via Vercel Cron, GitHub Actions, or external scheduler
 *
 * Authentication: Requires CRON_SECRET header matching environment variable
 */
export async function GET(request: NextRequest) {
  const startedAt = new Date();

  try {
    // Verify cron secret
    const cronSecret =
      request.headers.get('x-cron-secret') ||
      request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.warn('CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all saved searches with notifications enabled
    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        notifyNew: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (savedSearches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No saved searches with notifications enabled',
        searchesProcessed: 0,
        notificationsSent: 0,
      });
    }

    let notificationsSent = 0;
    let searchesProcessed = 0;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minalesh.et';

    // Define time range for "new" products (last 24 hours or since last run)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Process each saved search
    for (const savedSearch of savedSearches) {
      try {
        // Build search filters from saved search with safe type checking
        const rawFilters = savedSearch.filters;
        const filters: Record<string, unknown> = 
          rawFilters !== null && typeof rawFilters === 'object' && !Array.isArray(rawFilters)
            ? (rawFilters as Record<string, unknown>)
            : {};
        const searchFilters: SearchFilters = {
          query: savedSearch.query,
          categorySlug: typeof filters.category === 'string' ? filters.category : undefined,
          brand: typeof filters.brand === 'string' ? filters.brand : undefined,
          minPrice: typeof filters.minPrice === 'number' ? filters.minPrice : undefined,
          maxPrice: typeof filters.maxPrice === 'number' ? filters.maxPrice : undefined,
          minRating: typeof filters.rating === 'number' ? filters.rating : undefined,
          vendorName: typeof filters.vendor === 'string' ? filters.vendor : undefined,
          city: typeof filters.location === 'string' ? filters.location : undefined,
          inStock: typeof filters.inStock === 'boolean' ? filters.inStock : undefined,
        };

        // Search for matching products created in the last 24 hours
        const result = await searchProducts({
          filters: searchFilters,
          sort: { field: 'newest' },
          page: 1,
          perPage: 10,
        });

        // Filter for products created in the last 24 hours
        const newProducts = result.products.filter((product) => {
          const createdAt = new Date(product.createdAt);
          return createdAt >= yesterday;
        });

        searchesProcessed++;

        // If there are new matching products, send email
        if (newProducts.length > 0) {
          const searchUrl = buildSearchUrl(appUrl, savedSearch.query, filters);

          const productsForEmail = newProducts.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            salePrice: product.salePrice ? Number(product.salePrice) : undefined,
            imageUrl:
              Array.isArray(product.images) && product.images.length > 0
                ? String(product.images[0])
                : product.media && product.media.length > 0
                ? product.media[0].url
                : undefined,
          }));

          const emailTemplate = createSavedSearchDigestEmail(
            savedSearch.user.email,
            savedSearch.name,
            savedSearch.query,
            productsForEmail,
            searchUrl,
            appUrl
          );

          await sendEmail(emailTemplate);
          notificationsSent++;
        }
      } catch (searchError) {
        console.error(
          `Failed to process saved search ${savedSearch.id}:`,
          searchError
        );
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    // Record cron job execution
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-saved-search-digest',
        status: 'success',
        startedAt,
        completedAt,
        duration,
        recordsProcessed: savedSearches.length,
        metadata: {
          searchesProcessed,
          notificationsSent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search digests processed successfully',
      searchesProcessed,
      notificationsSent,
    });
  } catch (error) {
    console.error('Error in saved search digest cron:', error);

    // Record failed cron job execution
    try {
      await prisma.cronJobExecution.create({
        data: {
          jobName: 'process-saved-search-digest',
          status: 'failed',
          startedAt,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (recordError) {
      console.error('Failed to record cron job execution:', recordError);
    }

    return NextResponse.json(
      { error: 'Failed to process saved search digests' },
      { status: 500 }
    );
  }
}

/**
 * Build search URL with query and filters
 */
function buildSearchUrl(
  appUrl: string,
  query: string,
  filters: Record<string, unknown>
): string {
  const params = new URLSearchParams();
  params.set('q', query);

  // Add filters to URL params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  return `${appUrl}/products?${params.toString()}`;
}
