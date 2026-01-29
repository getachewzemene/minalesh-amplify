/**
 * Comprehensive Security Middleware
 * 
 * Combines CSRF protection, rate limiting, and other security measures
 * for easy application to API routes.
 */

import { NextResponse } from 'next/server';
import { withCsrfProtection } from './csrf';
import { withRateLimit, RateLimitConfig, RATE_LIMIT_CONFIGS } from './rate-limit';
import { withApiLogger } from './api-logger';

export interface SecurityMiddlewareOptions {
  // Rate limiting configuration
  rateLimit?: RateLimitConfig | false; // false to disable
  
  // CSRF protection configuration
  csrf?: {
    enabled?: boolean;
    skipForAuthHeader?: boolean; // Skip CSRF for Bearer token requests
  };
  
  // API logging
  logging?: boolean;
}

/**
 * Apply comprehensive security measures to an API route handler
 * 
 * @example
 * ```typescript
 * // Basic usage with default security
 * export const POST = withSecurity(handler);
 * 
 * // Custom rate limit
 * export const POST = withSecurity(handler, {
 *   rateLimit: RATE_LIMIT_CONFIGS.auth
 * });
 * 
 * // Disable CSRF for API-only endpoints
 * export const POST = withSecurity(handler, {
 *   csrf: { enabled: false }
 * });
 * ```
 */
export function withSecurity(
  handler: (request: Request, context?: any) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  // Default options
  const {
    rateLimit = RATE_LIMIT_CONFIGS.default,
    csrf = { enabled: true, skipForAuthHeader: true },
    logging = true,
  } = options;
  
  let wrappedHandler = handler;
  
  // Layer 1: Apply CSRF protection
  if (csrf.enabled !== false) {
    wrappedHandler = withCsrfProtection(wrappedHandler, {
      skipForAuthHeader: csrf.skipForAuthHeader,
    });
  }
  
  // Layer 2: Apply rate limiting
  if (rateLimit !== false) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimit);
  }
  
  // Layer 3: Apply API logging
  if (logging) {
    wrappedHandler = withApiLogger(wrappedHandler);
  }
  
  return wrappedHandler;
}

/**
 * Security preset for authentication routes
 * - Strict rate limiting (5 requests per 15 minutes)
 * - CSRF protection enabled
 * - API logging enabled
 */
export function withAuthSecurity(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: RATE_LIMIT_CONFIGS.auth,
    csrf: { enabled: true, skipForAuthHeader: false },
    logging: true,
  });
}

/**
 * Security preset for public API routes (read-only)
 * - Moderate rate limiting
 * - No CSRF protection (safe methods only)
 * - API logging enabled
 */
export function withPublicApiSecurity(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: RATE_LIMIT_CONFIGS.productList,
    csrf: { enabled: false },
    logging: true,
  });
}

/**
 * Security preset for admin routes
 * - Default rate limiting
 * - CSRF protection enabled
 * - API logging enabled
 */
export function withAdminSecurity(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: RATE_LIMIT_CONFIGS.default,
    csrf: { enabled: true, skipForAuthHeader: true },
    logging: true,
  });
}

/**
 * Security preset for payment routes
 * - Strict rate limiting
 * - CSRF protection enabled (no Bearer skip)
 * - API logging enabled
 */
export function withPaymentSecurity(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: RATE_LIMIT_CONFIGS.auth, // Strict
    csrf: { enabled: true, skipForAuthHeader: false },
    logging: true,
  });
}

// Export individual middleware for flexibility
export { withCsrfProtection } from './csrf';
export { withRateLimit, RATE_LIMIT_CONFIGS } from './rate-limit';
export { withApiLogger } from './api-logger';
