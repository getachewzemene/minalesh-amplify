/**
 * Redis Cache Tests
 * 
 * Tests for Redis caching functionality with graceful fallback to in-memory cache.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Redis module before importing cache
vi.mock('./redis', () => ({
  isRedisConfigured: vi.fn(() => false),
  isRedisConnected: vi.fn(() => false),
  redisCache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delPattern: vi.fn(),
    exists: vi.fn(),
    ttl: vi.fn(),
  },
}));

// Import after mocking
import { 
  getCache, 
  setCache, 
  getOrSetCache,
  clearCache,
  getCacheStats,
} from './cache';
import { isRedisConfigured, isRedisConnected, redisCache } from './redis';

describe('Redis Cache Integration', () => {
  beforeEach(async () => {
    await clearCache();
    vi.clearAllMocks();
  });

  describe('Fallback to memory cache', () => {
    it('should use memory cache when Redis is not configured', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);
      vi.mocked(isRedisConnected).mockReturnValue(false);

      await setCache('test-key', { data: 'test' });
      const result = await getCache('test-key');
      
      expect(result).toEqual({ data: 'test' });
      expect(redisCache.set).not.toHaveBeenCalled();
      expect(redisCache.get).not.toHaveBeenCalled();
    });

    it('should use memory cache when Redis is configured but not connected', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(isRedisConnected).mockReturnValue(false);

      await setCache('test-key', { data: 'test' });
      const result = await getCache('test-key');
      
      expect(result).toEqual({ data: 'test' });
      expect(redisCache.set).not.toHaveBeenCalled();
    });
  });

  describe('Redis cache operations', () => {
    beforeEach(() => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(isRedisConnected).mockReturnValue(true);
    });

    it('should use Redis when configured and connected', async () => {
      vi.mocked(redisCache.set).mockResolvedValue(true);
      vi.mocked(redisCache.get).mockResolvedValue({
        data: { value: 'from-redis' },
        timestamp: Date.now(),
        ttl: 300,
      });

      await setCache('test-key', { value: 'from-redis' });
      const result = await getCache('test-key');
      
      expect(result).toEqual({ value: 'from-redis' });
      expect(redisCache.set).toHaveBeenCalled();
      expect(redisCache.get).toHaveBeenCalled();
    });

    it('should fallback to memory if Redis get fails', async () => {
      vi.mocked(redisCache.get).mockRejectedValue(new Error('Redis error'));
      vi.mocked(redisCache.set).mockResolvedValue(false);

      // First set in memory cache (Redis will fail to set)
      await setCache('test-key', { fallback: true });
      
      // Redis get will fail, should fallback to memory
      const result = await getCache('test-key');
      
      expect(result).toEqual({ fallback: true });
    });

    it('should use getOrSetCache with Redis', async () => {
      let loaderCalled = false;
      const loader = async () => {
        loaderCalled = true;
        return { loaded: true };
      };

      // First call - cache miss
      vi.mocked(redisCache.get).mockResolvedValue(null);
      vi.mocked(redisCache.set).mockResolvedValue(true);

      const result1 = await getOrSetCache('test-key', loader);
      expect(result1).toEqual({ loaded: true });
      expect(loaderCalled).toBe(true);

      // Second call - cache hit
      loaderCalled = false;
      vi.mocked(redisCache.get).mockResolvedValue({
        data: { loaded: true },
        timestamp: Date.now(),
        ttl: 300,
      });

      const result2 = await getOrSetCache('test-key', loader);
      expect(result2).toEqual({ loaded: true });
      expect(loaderCalled).toBe(false); // Loader should not be called again
    });
  });

  describe('Cache statistics', () => {
    it('should report correct backend when Redis is available', () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(isRedisConnected).mockReturnValue(true);

      const stats = getCacheStats();
      expect(stats.backend).toBe('redis+memory');
    });

    it('should report memory backend when Redis is not available', () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);
      vi.mocked(isRedisConnected).mockReturnValue(false);

      const stats = getCacheStats();
      expect(stats.backend).toBe('memory');
    });
  });

  describe('TTL and stale-while-revalidate with Redis', () => {
    beforeEach(() => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(isRedisConnected).mockReturnValue(true);
    });

    it('should handle expired Redis cache entries', async () => {
      // Cache entry that's expired
      vi.mocked(redisCache.get).mockResolvedValue({
        data: { old: true },
        timestamp: Date.now() - 400000, // 400 seconds ago
        ttl: 300, // 5 minute TTL
        staleTime: 0,
      });
      vi.mocked(redisCache.del).mockResolvedValue(true);

      const result = await getCache('expired-key');
      
      expect(result).toBeNull();
      expect(redisCache.del).toHaveBeenCalledWith('expired-key');
    });

    it('should return stale data within stale-while-revalidate period', async () => {
      // Cache entry that's expired but within stale time
      vi.mocked(redisCache.get).mockResolvedValue({
        data: { stale: true },
        timestamp: Date.now() - 350000, // 350 seconds ago
        ttl: 300, // 5 minute TTL - expired
        staleTime: 600, // 10 minute stale time - within this period
      });

      const result = await getCache('stale-key', { staleTime: 600 });
      
      expect(result).toEqual({ stale: true });
    });
  });
});
