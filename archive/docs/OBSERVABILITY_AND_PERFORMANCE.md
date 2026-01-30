# Observability & Performance Guide

This document describes the observability and performance features implemented in the Minalesh marketplace platform.

## Table of Contents

- [Observability](#observability)
  - [Structured Logging](#structured-logging)
  - [Error Tracking with Sentry](#error-tracking-with-sentry)
  - [API Request Logging](#api-request-logging)
  - [Performance Metrics](#performance-metrics)
- [Performance & Caching](#performance--caching)
  - [CDN Strategy](#cdn-strategy)
  - [API Response Caching](#api-response-caching)
  - [Stale-While-Revalidate](#stale-while-revalidate)
  - [Image Optimization](#image-optimization)
  - [Cache Invalidation](#cache-invalidation)

## Observability

### Structured Logging

The platform uses **Pino** for high-performance structured logging. All logs are output in JSON format (in production) or pretty-printed (in development).

#### Usage

```typescript
import { logApiRequest, logError, logEvent, logMetric } from '@/lib/logger';

// Log an API request
logApiRequest({
  method: 'GET',
  path: '/api/products',
  statusCode: 200,
  duration: 150,
  userId: 'user-123',
});

// Log an error
logError(new Error('Something went wrong'), {
  context: 'product-creation',
  userId: 'user-123',
});

// Log an application event
logEvent('product_created', {
  productId: 'prod-123',
  vendorId: 'vendor-456',
});

// Log a performance metric
logMetric('db_query_time', 50, {
  query: 'SELECT * FROM products',
});
```

#### Log Levels

- **trace**: Most detailed debugging information
- **debug**: Debug information
- **info**: General informational messages (default in production)
- **warn**: Warning messages
- **error**: Error messages
- **fatal**: Critical errors

Configure the log level via the `LOG_LEVEL` environment variable.

### Error Tracking with Sentry

Sentry is integrated for automatic error tracking and performance monitoring across:

- **Client-side**: JavaScript errors in the browser
- **Server-side**: API route errors
- **Edge runtime**: Middleware and edge function errors

#### Configuration

Set up Sentry by adding these environment variables:

```bash
# Required
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Optional
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ENABLED="true"
```

#### Features

- Automatic error capture and reporting
- Performance monitoring (10% sample rate in production)
- Session replay (10% of sessions)
- Error filtering (filters out network errors and expected business logic errors)
- User context tracking
- Release tracking

### API Request Logging

All API routes can use the `withApiLogger` wrapper for automatic request/response logging:

```typescript
import { withApiLogger } from '@/lib/api-logger';

async function handler(request: Request) {
  // Your API logic here
  return NextResponse.json({ data: 'response' });
}

export const GET = withApiLogger(handler);
```

This automatically provides:
- Request method, path, and query parameters
- Response status code
- Request duration (added as `X-Response-Time` header)
- User ID extraction from JWT tokens
- Error handling and Sentry integration
- Structured logging

### Performance Metrics

Track performance metrics using the logging utilities:

```typescript
import { logMetric } from '@/lib/logger';

const startTime = Date.now();
// ... perform operation ...
const duration = Date.now() - startTime;

logMetric('operation_duration', duration, {
  operation: 'product_search',
  resultCount: 50,
});
```

## Performance & Caching

### CDN Strategy

The application is configured for optimal CDN caching:

#### Static Assets
- **Cache-Control**: `public, max-age=31536000, immutable`
- **Applied to**: `/assets/*`, `/_next/image/*`

#### API Responses
Configured per-endpoint with appropriate TTLs:
- Categories: 1 hour cache, 2 hour stale-while-revalidate
- Product search: 5 minute cache, 10 minute stale-while-revalidate

### API Response Caching

Use the caching utilities to cache expensive operations:

```typescript
import { getOrSetCache } from '@/lib/cache';

const result = await getOrSetCache(
  'cache-key',
  async () => {
    // Expensive operation (database query, API call, etc.)
    return await fetchData();
  },
  {
    ttl: 300,        // 5 minutes
    staleTime: 600,  // 10 minutes stale-while-revalidate
    prefix: 'products',
    tags: ['products', 'search'],
  }
);
```

#### Cache Options

- **ttl**: Time to live in seconds (how long the data is considered fresh)
- **staleTime**: Additional time in seconds to serve stale data while revalidating
- **prefix**: Namespace for cache keys
- **tags**: Tags for batch invalidation

### Stale-While-Revalidate

The platform implements the stale-while-revalidate pattern for optimal performance:

1. **Fresh Cache (age < TTL)**: Return cached data immediately
2. **Stale Cache (TTL < age < TTL + staleTime)**: Return stale data immediately, trigger background refresh
3. **Expired Cache (age > TTL + staleTime)**: Fetch fresh data before responding

This provides:
- Near-instant response times for most requests
- Always relatively fresh data
- Reduced load on the database

### Image Optimization

Next.js Image Optimization is configured with:

- **Formats**: AVIF and WebP support
- **Device sizes**: Responsive images for all screen sizes
- **Lazy loading**: Images load as they enter the viewport
- **CDN support**: Images can be served from a CDN
- **Automatic optimization**: Images are optimized on-demand

#### Usage

```tsx
import Image from 'next/image';

<Image
  src="/products/image.jpg"
  alt="Product"
  width={800}
  height={600}
  priority={false} // Set to true for above-the-fold images
/>
```

### Cache Invalidation

Invalidate cached data when content changes:

```typescript
import { invalidateCache } from '@/lib/cache';

// Invalidate by exact key
await invalidateCache('products:all-active');

// Invalidate by pattern
await invalidateCache(/^products:/);

// Invalidate with prefix
await invalidateCache(/^search:/, { prefix: 'products' });
```

#### Automatic Invalidation

Cache is automatically invalidated when:
- Products are created, updated, or deleted (admin operations)
- Categories are modified
- Other content changes

## Production Deployment Checklist

### Observability

- [ ] Configure Sentry DSN and project settings
- [ ] Set appropriate log level (`LOG_LEVEL=info` or `LOG_LEVEL=warn`)
- [ ] Set up log aggregation (CloudWatch, Datadog, etc.)
- [ ] Configure alerts for errors and performance issues
- [ ] Test error reporting in staging environment

### Performance

- [ ] Enable CDN for static assets
- [ ] Configure Redis or Memcached for production caching (replace in-memory cache)
- [ ] Set up cache invalidation webhooks
- [ ] Enable image optimization CDN
- [ ] Configure appropriate cache TTLs for your use case
- [ ] Test cache behavior under load
- [ ] Set up performance monitoring dashboards

## Monitoring Recommendations

### Metrics to Track

1. **API Response Times**
   - P50, P95, P99 latencies
   - Slow endpoint detection

2. **Cache Performance**
   - Hit rate
   - Miss rate
   - Cache size
   - Eviction rate

3. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Error types and frequencies

4. **Business Metrics**
   - Product searches per minute
   - Conversion rates
   - Cart abandonment

### Alerts to Configure

1. **Error Rate Alert**: Trigger when 5xx errors exceed threshold
2. **Performance Alert**: Trigger when P95 latency exceeds threshold
3. **Cache Miss Rate**: Alert when cache hit rate drops below acceptable level
4. **Availability Alert**: Trigger when uptime drops below 99.9%

## Troubleshooting

### High Log Volume

If logs are too verbose in production:
```bash
LOG_LEVEL=warn  # Only log warnings and errors
```

### Sentry Quota

If hitting Sentry quota:
- Adjust `tracesSampleRate` to a lower value (e.g., 0.05 for 5%)
- Implement more aggressive error filtering in Sentry config
- Set up alerts to monitor quota usage

### Cache Issues

**Cache not invalidating:**
- Check cache key patterns in invalidation calls
- Verify admin operations are calling invalidation functions
- Check cache TTL values

**Cache thrashing:**
- Increase TTL values
- Implement cache warming for frequently accessed data
- Review cache key strategy (too granular keys can cause issues)

## Future Enhancements

Planned improvements:

1. **Distributed Caching**: Migrate from in-memory to Redis for multi-instance deployments
2. **Query Performance Monitoring**: Track slow database queries
3. **Real User Monitoring (RUM)**: Track actual user experience metrics
4. **Synthetic Monitoring**: Automated uptime and performance checks
5. **A/B Testing Infrastructure**: Test performance optimizations
6. **GraphQL Integration**: Consider GraphQL for more efficient data fetching
