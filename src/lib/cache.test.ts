/**
 * Cache Utilities Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getCache, 
  setCache, 
  invalidateCache, 
  clearCache,
  getOrSetCache,
  getCacheStats 
} from './cache';

describe('Cache Utilities', () => {
  beforeEach(async () => {
    await clearCache();
  });

  describe('setCache and getCache', () => {
    it('should set and retrieve cache data', async () => {
      await setCache('test-key', { data: 'test' });
      const result = await getCache('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', async () => {
      const result = await getCache('non-existent');
      expect(result).toBeNull();
    });

    it('should support different data types', async () => {
      await setCache('string', 'test');
      await setCache('number', 42);
      await setCache('object', { key: 'value' });
      await setCache('array', [1, 2, 3]);

      expect(await getCache('string')).toBe('test');
      expect(await getCache('number')).toBe(42);
      expect(await getCache('object')).toEqual({ key: 'value' });
      expect(await getCache('array')).toEqual([1, 2, 3]);
    });

    it('should use prefix for namespacing', async () => {
      await setCache('key', 'value1', { prefix: 'ns1' });
      await setCache('key', 'value2', { prefix: 'ns2' });

      expect(await getCache('key', { prefix: 'ns1' })).toBe('value1');
      expect(await getCache('key', { prefix: 'ns2' })).toBe('value2');
    });
  });

  describe('TTL and expiration', () => {
    it('should respect TTL', async () => {
      await setCache('test-key', 'data', { ttl: 1 }); // 1 second TTL
      
      // Should be available immediately
      let result = await getCache('test-key');
      expect(result).toBe('data');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      result = await getCache('test-key');
      expect(result).toBeNull();
    });

    it('should support stale-while-revalidate', async () => {
      await setCache('test-key', 'data', { ttl: 1, staleTime: 2 });
      
      // Wait for TTL to expire but within stale time
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should still return stale data
      const result = await getCache('test-key', { staleTime: 2 });
      expect(result).toBe('data');
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate exact key', async () => {
      await setCache('test-key', 'data');
      await invalidateCache('test-key');
      
      const result = await getCache('test-key');
      expect(result).toBeNull();
    });

    it('should invalidate by pattern', async () => {
      await setCache('user:1', 'data1');
      await setCache('user:2', 'data2');
      await setCache('product:1', 'data3');
      
      await invalidateCache(/^user:/);
      
      expect(await getCache('user:1')).toBeNull();
      expect(await getCache('user:2')).toBeNull();
      expect(await getCache('product:1')).toBe('data3');
    });

    it('should invalidate with prefix', async () => {
      await setCache('key1', 'data1', { prefix: 'ns' });
      await setCache('key2', 'data2', { prefix: 'ns' });
      
      await invalidateCache(/^ns:key/, { prefix: '' });
      
      expect(await getCache('key1', { prefix: 'ns' })).toBeNull();
      expect(await getCache('key2', { prefix: 'ns' })).toBeNull();
    });
  });

  describe('getOrSetCache', () => {
    it('should load data if not cached', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return 'loaded-data';
      };

      const result = await getOrSetCache('test-key', loader);
      
      expect(result).toBe('loaded-data');
      expect(callCount).toBe(1);
    });

    it('should return cached data without calling loader', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return 'loaded-data';
      };

      // First call
      await getOrSetCache('test-key', loader);
      
      // Second call
      const result = await getOrSetCache('test-key', loader);
      
      expect(result).toBe('loaded-data');
      expect(callCount).toBe(1); // Loader called only once
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      await setCache('key1', 'data1');
      await setCache('key2', 'data2');
      await setCache('key3', 'data3');
      
      await clearCache();
      
      expect(await getCache('key1')).toBeNull();
      expect(await getCache('key2')).toBeNull();
      expect(await getCache('key3')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      await setCache('key1', 'data1');
      await setCache('key2', 'data2');
      
      const stats = getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});
