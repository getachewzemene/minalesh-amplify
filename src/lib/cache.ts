/**
 * Caching Utilities
 * 
 * Provides caching strategies for API responses with support for:
 * - In-memory caching (development)
 * - Stale-while-revalidate pattern
 * - Cache invalidation
 * - TTL management
 */

import { logCache, logMetric } from './logger';

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, CacheEntry>();

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;
  /**
   * Stale-while-revalidate time in seconds
   * During this period, stale data is returned while fresh data is fetched
   */
  staleTime?: number;
  /**
   * Cache key prefix for namespacing
   */
  prefix?: string;
  /**
   * Tags for cache invalidation
   */
  tags?: string[];
}

/**
 * Get data from cache
 */
export async function getCache<T = any>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
  const entry = cache.get(cacheKey);

  if (!entry) {
    logCache('miss', cacheKey);
    return null;
  }

  const age = (Date.now() - entry.timestamp) / 1000;
  const ttl = options.ttl || entry.ttl;
  const staleTime = options.staleTime || 0;

  // Check if cache is fresh
  if (age < ttl) {
    logCache('hit', cacheKey, { age, ttl, status: 'fresh' });
    return entry.data as T;
  }

  // Check if within stale-while-revalidate period
  if (staleTime > 0 && age < ttl + staleTime) {
    logCache('hit', cacheKey, { age, ttl, status: 'stale' });
    return entry.data as T;
  }

  // Cache expired
  cache.delete(cacheKey);
  logCache('miss', cacheKey, { age, ttl, status: 'expired' });
  return null;
}

/**
 * Set data in cache
 */
export async function setCache<T = any>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
  const ttl = options.ttl || 300; // Default 5 minutes

  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });

  logCache('set', cacheKey, { ttl, tags: options.tags });
  logMetric('cache_size', cache.size);
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(
  keyOrPattern: string | RegExp,
  options: CacheOptions = {}
): Promise<number> {
  const prefix = options.prefix || '';
  let count = 0;

  if (typeof keyOrPattern === 'string') {
    // Exact key match
    const cacheKey = prefix ? `${prefix}:${keyOrPattern}` : keyOrPattern;
    if (cache.delete(cacheKey)) {
      count++;
      logCache('invalidate', cacheKey);
    }
  } else {
    // Pattern match
    for (const key of cache.keys()) {
      if (keyOrPattern.test(key)) {
        cache.delete(key);
        count++;
        logCache('invalidate', key);
      }
    }
  }

  logMetric('cache_invalidated', count);
  return count;
}

/**
 * Invalidate cache by tags
 */
export async function invalidateCacheByTag(tag: string): Promise<number> {
  // For in-memory cache, we need to track tags separately
  // In production with Redis, use Redis tags feature
  // For now, invalidate all (simplified)
  const count = cache.size;
  cache.clear();
  logCache('invalidate', `tag:${tag}`, { count });
  return count;
}

/**
 * Get or set cache with a loader function
 */
export async function getOrSetCache<T = any>(
  key: string,
  loader: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cached = await getCache<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Load fresh data
  const startTime = Date.now();
  const data = await loader();
  const duration = Date.now() - startTime;

  // Store in cache
  await setCache(key, data, options);

  logMetric('cache_loader_duration', duration, { key });
  return data;
}

/**
 * Cache wrapper for functions
 */
export function withCache<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: CacheOptions & {
    keyGenerator?: (...args: TArgs) => string;
  } = {}
) {
  const keyGen = options.keyGenerator || ((...args: TArgs) => JSON.stringify(args));

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyGen(...args);
    return getOrSetCache(key, () => fn(...args), options);
  };
}

/**
 * Clear entire cache (use with caution)
 */
export async function clearCache(): Promise<void> {
  const size = cache.size;
  cache.clear();
  logMetric('cache_cleared', size);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
