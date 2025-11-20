/**
 * Unit Tests: Rate Limiting
 * 
 * Tests for IP-based rate limiting middleware.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe('Client IP Detection', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          },
        },
      } as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.168.1.1';
            return null;
          },
        },
      } as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should fallback to unknown when no IP headers', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('unknown');
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1, 172.16.0.1';
            return null;
          },
        },
      } as Request;

      const ip = getClientIp(mockRequest);
      expect(ip).toBe('192.168.1.1'); // Should use first IP
    });
  });

  describe('Rate Limit Check', () => {
    it('should allow requests within limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const clientIp = '192.168.1.1';

      const result1 = checkRateLimit(clientIp, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit(clientIp, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests exceeding limit', () => {
      const config = { windowMs: 60000, maxRequests: 3 };
      const clientIp = '192.168.1.1';

      // Make 3 allowed requests
      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);

      // 4th request should be blocked
      const result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different IPs separately', () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP1 makes 2 requests
      checkRateLimit(ip1, config);
      checkRateLimit(ip1, config);

      // IP1 should be blocked
      const result1 = checkRateLimit(ip1, config);
      expect(result1.allowed).toBe(false);

      // IP2 should still be allowed
      const result2 = checkRateLimit(ip2, config);
      expect(result2.allowed).toBe(true);
    });

    it('should reset counter after window expires', () => {
      vi.useFakeTimers();
      const config = { windowMs: 1000, maxRequests: 2 };
      const clientIp = '192.168.1.1';

      // Make 2 requests
      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);

      // Should be blocked
      let result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1100);

      // Should be allowed again
      result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should include reset timestamp', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const clientIp = '192.168.1.1';

      const result = checkRateLimit(clientIp, config);
      
      expect(result.resetAt).toBeDefined();
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should have auth rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.auth).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have product list rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.productList).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.productList.maxRequests).toBe(60);
      expect(RATE_LIMIT_CONFIGS.productList.windowMs).toBe(60 * 1000);
    });

    it('should have default rate limit config', () => {
      expect(RATE_LIMIT_CONFIGS.default).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.default.maxRequests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.default.windowMs).toBe(60 * 1000);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit for specific IP', () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      const clientIp = '192.168.1.1';

      // Exhaust limit
      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);
      let result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(false);

      // Reset
      resetRateLimit(clientIp);

      // Should be allowed again
      result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(true);
    });

    it('should clear all rate limits', () => {
      const config = { windowMs: 60000, maxRequests: 1 };
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Exhaust limits for both IPs
      checkRateLimit(ip1, config);
      checkRateLimit(ip2, config);

      // Both should be blocked
      expect(checkRateLimit(ip1, config).allowed).toBe(false);
      expect(checkRateLimit(ip2, config).allowed).toBe(false);

      // Clear all
      clearAllRateLimits();

      // Both should be allowed again
      expect(checkRateLimit(ip1, config).allowed).toBe(true);
      expect(checkRateLimit(ip2, config).allowed).toBe(true);
    });
  });

  describe('Remaining Counter', () => {
    it('should correctly calculate remaining requests', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const clientIp = '192.168.1.1';

      expect(checkRateLimit(clientIp, config).remaining).toBe(4);
      expect(checkRateLimit(clientIp, config).remaining).toBe(3);
      expect(checkRateLimit(clientIp, config).remaining).toBe(2);
      expect(checkRateLimit(clientIp, config).remaining).toBe(1);
      expect(checkRateLimit(clientIp, config).remaining).toBe(0);
      expect(checkRateLimit(clientIp, config).remaining).toBe(0);
    });

    it('should not go negative', () => {
      const config = { windowMs: 60000, maxRequests: 1 };
      const clientIp = '192.168.1.1';

      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);
      
      const result = checkRateLimit(clientIp, config);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle rapid successive requests', () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const clientIp = '192.168.1.1';

      const results = Array.from({ length: 15 }, () => 
        checkRateLimit(clientIp, config)
      );

      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;

      expect(allowedCount).toBe(10);
      expect(blockedCount).toBe(5);
    });
  });

  describe('Window Management', () => {
    it('should maintain separate windows per IP', () => {
      vi.useFakeTimers();
      const config = { windowMs: 1000, maxRequests: 2 };
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP1 makes requests
      checkRateLimit(ip1, config);
      checkRateLimit(ip1, config);

      // Advance time partially
      vi.advanceTimersByTime(500);

      // IP2 makes requests (different window)
      checkRateLimit(ip2, config);
      checkRateLimit(ip2, config);

      // IP1's window should not have reset yet
      expect(checkRateLimit(ip1, config).allowed).toBe(false);

      // IP2's window should also not have reset
      expect(checkRateLimit(ip2, config).allowed).toBe(false);

      // Advance time to reset IP1's window
      vi.advanceTimersByTime(600);

      // IP1 should be reset
      expect(checkRateLimit(ip1, config).allowed).toBe(true);

      // IP2 still blocked (window hasn't expired)
      expect(checkRateLimit(ip2, config).allowed).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max requests', () => {
      const config = { windowMs: 60000, maxRequests: 0 };
      const clientIp = '192.168.1.1';

      const result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(false);
    });

    it('should handle very large request limits', () => {
      const config = { windowMs: 60000, maxRequests: 1000000 };
      const clientIp = '192.168.1.1';

      // Should allow many requests
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(clientIp, config);
        expect(result.allowed).toBe(true);
      }
    });

    it('should handle very short time windows', () => {
      vi.useFakeTimers();
      const config = { windowMs: 100, maxRequests: 2 };
      const clientIp = '192.168.1.1';

      checkRateLimit(clientIp, config);
      checkRateLimit(clientIp, config);
      expect(checkRateLimit(clientIp, config).allowed).toBe(false);

      vi.advanceTimersByTime(150);
      expect(checkRateLimit(clientIp, config).allowed).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Auth Endpoint Protection', () => {
    it('should strictly limit auth endpoints', () => {
      const config = RATE_LIMIT_CONFIGS.auth;
      const clientIp = '192.168.1.1';

      // Make max allowed requests
      for (let i = 0; i < config.maxRequests; i++) {
        const result = checkRateLimit(clientIp, config);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const result = checkRateLimit(clientIp, config);
      expect(result.allowed).toBe(false);

      // Verify it's a longer window (15 minutes)
      expect(config.windowMs).toBe(15 * 60 * 1000);
    });
  });

  describe('Product List Protection', () => {
    it('should allow reasonable traffic for product listing', () => {
      const config = RATE_LIMIT_CONFIGS.productList;
      const clientIp = '192.168.1.1';

      // Make multiple requests (should be allowed up to 60)
      for (let i = 0; i < 50; i++) {
        const result = checkRateLimit(clientIp, config);
        expect(result.allowed).toBe(true);
      }

      // Verify limit is 60 per minute
      expect(config.maxRequests).toBe(60);
      expect(config.windowMs).toBe(60 * 1000);
    });
  });
});
