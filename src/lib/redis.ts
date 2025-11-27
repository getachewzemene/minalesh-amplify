/**
 * Redis Client Module
 * 
 * Provides Redis connection management for caching.
 * Falls back gracefully when Redis is not configured.
 */

import Redis, { RedisOptions } from 'ioredis';
import { logMetric } from './logger';

// Redis client singleton
let redisClient: Redis | null = null;

// Track connection state
let isConnected = false;
let connectionAttempted = false;

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Get Redis client options from environment
 */
function getRedisOptions(): RedisOptions | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return null;
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      // Stop retrying after 3 attempts
      if (times > 3) {
        return null;
      }
      // Wait exponentially longer between retries
      return Math.min(times * 100, 3000);
    },
    enableReadyCheck: true,
    // Connection timeout
    connectTimeout: 10000,
    // Command timeout
    commandTimeout: 5000,
  };

  // Handle TLS if enabled
  if (process.env.REDIS_TLS_ENABLED === 'true') {
    options.tls = {};
  }

  return options;
}

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis | null {
  // Return existing client if connected
  if (redisClient && isConnected) {
    return redisClient;
  }

  // Don't retry if we already failed to connect
  if (connectionAttempted && !isConnected) {
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  const options = getRedisOptions();

  if (!redisUrl || !options) {
    return null;
  }

  connectionAttempted = true;

  try {
    redisClient = new Redis(redisUrl, options);

    redisClient.on('connect', () => {
      isConnected = true;
      logMetric('redis_connection', 1, { status: 'connected' });
    });

    redisClient.on('error', (err: Error) => {
      isConnected = false;
      logMetric('redis_error', 1, { error: err.message });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logMetric('redis_connection', 0, { status: 'closed' });
    });

    return redisClient;
  } catch (error) {
    logMetric('redis_error', 1, { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

/**
 * Check if Redis is currently connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    connectionAttempted = false;
  }
}

/**
 * Redis cache operations with automatic fallback
 */
export const redisCache = {
  /**
   * Get value from Redis
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logMetric('redis_get_error', 1, { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  },

  /**
   * Set value in Redis with optional TTL
   */
  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logMetric('redis_set_error', 1, { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  },

  /**
   * Delete key from Redis
   */
  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logMetric('redis_del_error', 1, { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  },

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    if (!client) {
      return 0;
    }

    try {
      // Use SCAN to find matching keys (safer for production than KEYS)
      let cursor = '0';
      let deleted = 0;

      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');

      return deleted;
    } catch (error) {
      logMetric('redis_del_pattern_error', 1, { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logMetric('redis_exists_error', 1, { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  },

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    if (!client) {
      return -1;
    }

    try {
      return await client.ttl(key);
    } catch (error) {
      logMetric('redis_ttl_error', 1, { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return -1;
    }
  },
};
