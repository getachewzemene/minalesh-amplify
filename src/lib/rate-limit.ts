/**
 * Rate Limiting Middleware
 * 
 * Provides IP-based rate limiting for API routes to prevent abuse.
 * Uses Redis for distributed rate limiting with in-memory fallback.
 * Integrates with security features (IP whitelist/blacklist, bot detection).
 */

import { NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import { performSecurityCheck, isIpWhitelisted, logSecurityEvent } from './security';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipWhitelist?: boolean; // Skip whitelist check (default: false)
  skipSecurityCheck?: boolean; // Skip security checks (default: false)
}

export interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when the window resets
}

// In-memory store for rate limit tracking (fallback when Redis unavailable)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
  productList: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
};

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default (for development/testing)
  return 'unknown';
}

/**
 * Check if request is rate limited using Redis (distributed) or in-memory (fallback)
 */
export async function checkRateLimitRedis(
  clientIp: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const now = Date.now();
  const key = `ratelimit:${clientIp}`;
  const redis = getRedisClient();

  // Use Redis if available
  if (redis) {
    try {
      const windowSeconds = Math.ceil(config.windowMs / 1000);
      
      // Use Redis sorted set for sliding window rate limiting
      // Remove entries older than the window
      await redis.zremrangebyscore(key, '-inf', now - config.windowMs);
      
      // Count requests in current window
      const count = await redis.zcard(key);
      
      // Check if limit exceeded
      if (count >= config.maxRequests) {
        // Get oldest entry to calculate reset time
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetAt = oldest.length > 1 
          ? parseInt(oldest[1]) + config.windowMs 
          : now + config.windowMs;
        
        return {
          allowed: false,
          remaining: 0,
          resetAt
        };
      }
      
      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, windowSeconds * 2); // Set expiry to 2x window
      
      // Get updated count
      const newCount = await redis.zcard(key);
      const remaining = Math.max(0, config.maxRequests - newCount);
      
      // Calculate reset time (start of window + windowMs)
      const oldestAfterAdd = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = oldestAfterAdd.length > 1 
        ? parseInt(oldestAfterAdd[1]) + config.windowMs 
        : now + config.windowMs;
      
      return {
        allowed: true,
        remaining,
        resetAt
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
      // Fall through to in-memory rate limiting
    }
  }

  // Fallback to in-memory rate limiting
  return checkRateLimit(clientIp, config);
}

/**
 * Check if request is rate limited (in-memory)
 */
export function checkRateLimit(
  clientIp: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = clientIp;
  
  let entry = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware wrapper for API routes
 * Integrates with security features (IP whitelist/blacklist, bot detection)
 */
export function withRateLimit(
  handler: (request: Request, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    const clientIp = getClientIp(request);
    const endpoint = new URL(request.url).pathname;

    // Perform security check unless explicitly skipped
    if (!config.skipSecurityCheck) {
      const securityCheck = await performSecurityCheck(request, clientIp, endpoint);
      
      if (!securityCheck.allowed) {
        await logSecurityEvent(
          clientIp,
          'security_block',
          securityCheck.severity || 'high',
          request.headers.get('user-agent'),
          endpoint,
          { reason: securityCheck.reason }
        );

        return NextResponse.json(
          {
            error: 'Access denied',
            message: securityCheck.reason || 'Request blocked for security reasons',
          },
          {
            status: 403,
            headers: {
              'X-Security-Block': 'true',
            },
          }
        );
      }

      // If CAPTCHA required but not provided, return 403 with captcha requirement
      if (securityCheck.requiresCaptcha) {
        const captchaToken = request.headers.get('x-captcha-token');
        if (!captchaToken) {
          return NextResponse.json(
            {
              error: 'CAPTCHA required',
              message: 'Please complete the CAPTCHA verification',
              requiresCaptcha: true,
            },
            {
              status: 403,
              headers: {
                'X-Captcha-Required': 'true',
              },
            }
          );
        }
        // TODO: Verify CAPTCHA token (to be implemented with CAPTCHA service)
      }
    }

    // Check whitelist unless explicitly skipped
    if (!config.skipWhitelist) {
      const isWhitelisted = await isIpWhitelisted(clientIp);
      if (isWhitelisted) {
        // Bypass rate limiting for whitelisted IPs
        const response = await handler(request, context);
        response.headers.set('X-RateLimit-Bypass', 'whitelist');
        return response;
      }
    }

    // Check rate limit using Redis (with fallback to in-memory)
    const { allowed, remaining, resetAt } = await checkRateLimitRedis(clientIp, config);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      
      // Log rate limit exceeded event
      await logSecurityEvent(
        clientIp,
        'rate_limit_exceeded',
        'medium',
        request.headers.get('user-agent'),
        endpoint,
        { limit: config.maxRequests, window: config.windowMs }
      );

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }
    
    // Execute handler
    const response = await handler(request, context);
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetAt.toString());
    
    return response;
  };
}

/**
 * Reset rate limit for a specific IP (useful for testing)
 */
export function resetRateLimit(clientIp: string): void {
  rateLimitStore.delete(clientIp);
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
