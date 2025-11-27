/**
 * Caching Utilities
 * 
 * Provides caching strategies for API responses with support for:
 * - Redis caching (production) with automatic fallback to in-memory
 * - In-memory caching (development/fallback)
 * - Stale-while-revalidate pattern
 * - Cache invalidation
 * - TTL management
 */

import { logCache, logMetric } from './logger';
import { redisCache, isRedisConfigured, isRedisConnected } from './redis';

// Simple in-memory cache (fallback when Redis is not available)
const memoryCache = new Map<string, CacheEntry>();

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
  staleTime?: number;
}

/**
 * Check if Redis should be used
 */
function useRedis(): boolean {
  return isRedisConfigured() && isRedisConnected();
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
export async function getCache<T = unknown>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;

  // Try Redis first if available
  if (useRedis()) {
    try {
      const redisEntry = await redisCache.get<CacheEntry>(cacheKey);
      if (redisEntry) {
        const age = (Date.now() - redisEntry.timestamp) / 1000;
        const ttl = options.ttl || redisEntry.ttl;
        const staleTime = options.staleTime || redisEntry.staleTime || 0;

        // Check if cache is fresh or within stale period
        if (age < ttl || (staleTime > 0 && age < ttl + staleTime)) {
          const status = age < ttl ? 'fresh' : 'stale';
          logCache('hit', cacheKey, { age, ttl, status, backend: 'redis' });
          return redisEntry.data as T;
        }

        // Cache expired, delete from Redis
        await redisCache.del(cacheKey);
        logCache('miss', cacheKey, { age, ttl, status: 'expired', backend: 'redis' });
        return null;
      }
      logCache('miss', cacheKey, { backend: 'redis' });
      return null;
    } catch {
      // Fall through to memory cache on Redis error
    }
  }

  // Fall back to memory cache
  const entry = memoryCache.get(cacheKey);

  if (!entry) {
    logCache('miss', cacheKey, { backend: 'memory' });
    return null;
  }

  const age = (Date.now() - entry.timestamp) / 1000;
  const ttl = options.ttl || entry.ttl;
  const staleTime = options.staleTime || entry.staleTime || 0;

  // Check if cache is fresh
  if (age < ttl) {
    logCache('hit', cacheKey, { age, ttl, status: 'fresh', backend: 'memory' });
    return entry.data as T;
  }

  // Check if within stale-while-revalidate period
  if (staleTime > 0 && age < ttl + staleTime) {
    logCache('hit', cacheKey, { age, ttl, status: 'stale', backend: 'memory' });
    return entry.data as T;
  }

  // Cache expired
  memoryCache.delete(cacheKey);
  logCache('miss', cacheKey, { age, ttl, status: 'expired', backend: 'memory' });
  return null;
}

/**
 * Set data in cache
 */
export async function setCache<T = unknown>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
  const ttl = options.ttl || 300; // Default 5 minutes
  const staleTime = options.staleTime || 0;

  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
    staleTime,
  };

  // Try Redis first if available
  if (useRedis()) {
    try {
      // Total time = TTL + stale time for Redis expiry
      const totalTtl = ttl + staleTime;
      const success = await redisCache.set(cacheKey, entry, totalTtl);
      if (success) {
        logCache('set', cacheKey, { ttl, staleTime, tags: options.tags, backend: 'redis' });
        return;
      }
    } catch {
      // Fall through to memory cache on Redis error
    }
  }

  // Fall back to memory cache
  memoryCache.set(cacheKey, entry);

  logCache('set', cacheKey, { ttl, staleTime, tags: options.tags, backend: 'memory' });
  logMetric('cache_size', memoryCache.size);
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

  // Handle Redis invalidation
  if (useRedis()) {
    try {
      if (typeof keyOrPattern === 'string') {
        // Exact key match
        const cacheKey = prefix ? `${prefix}:${keyOrPattern}` : keyOrPattern;
        const success = await redisCache.del(cacheKey);
        if (success) {
          count++;
          logCache('invalidate', cacheKey, { backend: 'redis' });
        }
      } else {
        // Pattern match - convert RegExp to Redis glob pattern
        const pattern = prefix ? `${prefix}:*` : '*';
        const deleted = await redisCache.delPattern(pattern);
        count += deleted;
        if (deleted > 0) {
          logCache('invalidate', `pattern:${keyOrPattern.source}`, { count: deleted, backend: 'redis' });
        }
      }
    } catch {
      // Continue with memory cache invalidation
    }
  }

  // Also invalidate from memory cache
  if (typeof keyOrPattern === 'string') {
    // Exact key match
    const cacheKey = prefix ? `${prefix}:${keyOrPattern}` : keyOrPattern;
    if (memoryCache.delete(cacheKey)) {
      count++;
      logCache('invalidate', cacheKey, { backend: 'memory' });
    }
  } else {
    // Pattern match
    for (const key of memoryCache.keys()) {
      if (keyOrPattern.test(key)) {
        memoryCache.delete(key);
        count++;
        logCache('invalidate', key, { backend: 'memory' });
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
  let count = 0;

  // Invalidate from Redis using pattern
  if (useRedis()) {
    try {
      const deleted = await redisCache.delPattern(`*:${tag}:*`);
      count += deleted;
      logCache('invalidate', `tag:${tag}`, { count: deleted, backend: 'redis' });
    } catch {
      // Continue with memory cache invalidation
    }
  }

  // For in-memory cache, invalidate all (simplified)
  const memoryCount = memoryCache.size;
  memoryCache.clear();
  count += memoryCount;
  logCache('invalidate', `tag:${tag}`, { count: memoryCount, backend: 'memory' });
  
  return count;
}

/**
 * Get or set cache with a loader function
 */
export async function getOrSetCache<T = unknown>(
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
export function withCache<TArgs extends unknown[], TResult>(
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
  // Clear Redis cache
  if (useRedis()) {
    try {
      await redisCache.delPattern('*');
      logMetric('redis_cache_cleared', 1);
    } catch {
      // Continue with memory cache clear
    }
  }

  // Clear memory cache
  const size = memoryCache.size;
  memoryCache.clear();
  logMetric('cache_cleared', size);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
    backend: useRedis() ? 'redis+memory' : 'memory',
  };
}

/**
 * Export for testing purposes
 */
export { useRedis as _useRedis };
