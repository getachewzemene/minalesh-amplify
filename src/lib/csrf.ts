/**
 * CSRF Protection Module
 * 
 * Provides Cross-Site Request Forgery protection using the Double Submit Cookie pattern.
 * Tokens are generated and validated for state-changing operations.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRedisClient } from './redis';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Store CSRF token in Redis (with fallback to cookie validation only)
 */
export async function storeCsrfToken(token: string, identifier: string): Promise<void> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const key = `csrf:${identifier}`;
      await redis.setex(key, CSRF_TOKEN_EXPIRY, token);
    } catch (error) {
      console.error('Error storing CSRF token in Redis:', error);
      // Fallback to cookie-only validation
    }
  }
}

/**
 * Verify CSRF token from Redis (with fallback to cookie validation)
 */
export async function verifyCsrfTokenFromStore(token: string, identifier: string): Promise<boolean> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const key = `csrf:${identifier}`;
      const storedToken = await redis.get(key);
      
      if (!storedToken) {
        return false; // Token not found or expired
      }
      
      // Use constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(storedToken),
        Buffer.from(token)
      );
    } catch (error) {
      console.error('Error verifying CSRF token from Redis:', error);
      // Fallback to cookie validation
      return true; // Allow cookie-only validation in fallback
    }
  }
  
  // If Redis not available, rely on cookie validation only
  return true;
}

/**
 * Extract CSRF token from request
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  // Check header first (preferred method)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }
  
  // Check body for form submissions (fallback)
  // Note: This would require parsing the body, which we skip here for API routes
  // In practice, APIs should use headers
  
  return null;
}

/**
 * Extract CSRF token from cookie
 */
export function getCsrfTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[CSRF_COOKIE_NAME] || null;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const requestToken = getCsrfTokenFromRequest(request);
  const cookieToken = getCsrfTokenFromCookie(request);
  
  // Both tokens must be present
  if (!requestToken) {
    return { valid: false, reason: 'CSRF token missing from request' };
  }
  
  if (!cookieToken) {
    return { valid: false, reason: 'CSRF token missing from cookie' };
  }
  
  // Tokens must match (Double Submit Cookie pattern)
  if (requestToken !== cookieToken) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }
  
  // Additional verification from Redis if available
  // Using a simple identifier based on token itself
  const identifier = crypto.createHash('sha256').update(cookieToken).digest('hex');
  const redisValid = await verifyCsrfTokenFromStore(requestToken, identifier);
  
  if (!redisValid) {
    return { valid: false, reason: 'CSRF token expired or invalid' };
  }
  
  return { valid: true };
}

/**
 * CSRF protection middleware for API routes
 * Should be applied to all state-changing operations (POST, PUT, PATCH, DELETE)
 */
export function withCsrfProtection(
  handler: (request: Request, context?: any) => Promise<NextResponse>,
  options: {
    skipMethods?: string[]; // Methods to skip CSRF check (e.g., ['GET', 'HEAD', 'OPTIONS'])
    skipForAuthHeader?: boolean; // Skip CSRF for requests with Bearer token
  } = {}
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    const method = request.method;
    const skipMethods = options.skipMethods || ['GET', 'HEAD', 'OPTIONS'];
    
    // Skip CSRF check for safe methods
    if (skipMethods.includes(method)) {
      return handler(request, context);
    }
    
    // Skip CSRF for API requests with Bearer token (API clients)
    if (options.skipForAuthHeader) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return handler(request, context);
      }
    }
    
    // Validate CSRF token
    const validation = await validateCsrfToken(request);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          message: validation.reason || 'Invalid or missing CSRF token',
        },
        {
          status: 403,
          headers: {
            'X-CSRF-Protection': 'failed',
          },
        }
      );
    }
    
    // Execute handler
    return handler(request, context);
  };
}

/**
 * Generate CSRF token response for client
 * Use this in a GET endpoint to provide tokens to clients
 */
export async function generateCsrfTokenResponse(): Promise<NextResponse> {
  const token = generateCsrfToken();
  const identifier = crypto.createHash('sha256').update(token).digest('hex');
  
  // Store in Redis
  await storeCsrfToken(token, identifier);
  
  const response = NextResponse.json({
    csrfToken: token,
  });
  
  // Set cookie
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible by JavaScript
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY,
  });
  
  return response;
}

/**
 * Check if request is exempt from CSRF (e.g., from same origin)
 */
export function isRequestExemptFromCsrf(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // If no origin or referer, can't verify same-origin
  if (!origin && !referer) {
    return false;
  }
  
  // Check if origin matches host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return true;
      }
    } catch {
      return false;
    }
  }
  
  // Check if referer matches host
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return true;
      }
    } catch {
      return false;
    }
  }
  
  return false;
}
