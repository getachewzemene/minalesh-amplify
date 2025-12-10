import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getTokenFromRequest, getUserFromToken, hasRole } from './auth';
import { UnauthorizedError, ForbiddenError } from './errors';

/**
 * Middleware to verify authentication and extract user payload
 */
export function withAuth(request: Request) {
  const token = getTokenFromRequest(request);
  const payload = getUserFromToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      payload: null,
    };
  }

  return { error: null, payload };
}

/**
 * Middleware to verify user has required role
 */
export function withRole(request: Request, requiredRole: UserRole | UserRole[]) {
  const authResult = withAuth(request);
  
  if (authResult.error) {
    return authResult;
  }

  const { payload } = authResult;
  
  if (!payload || !hasRole(payload.role, requiredRole)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      ),
      payload: null,
    };
  }

  return { error: null, payload };
}

/**
 * Middleware to verify admin access
 */
export function withAdmin(request: Request) {
  return withRole(request, 'admin');
}

/**
 * Middleware to verify vendor or admin access
 */
export function withVendorOrAdmin(request: Request) {
  return withRole(request, ['vendor', 'admin']);
}

/**
 * Alternative middleware that throws errors instead of returning response objects.
 * Use this with withApiLogger for cleaner error handling.
 * 
 * @example
 * ```typescript
 * import { withApiLogger } from '@/lib/api-logger';
 * import { requireAuth } from '@/lib/middleware';
 * 
 * async function handler(request: Request) {
 *   const payload = requireAuth(request);
 *   // ... rest of handler
 * }
 * 
 * export const GET = withApiLogger(handler);
 * ```
 */
export function requireAuth(request: Request) {
  const token = getTokenFromRequest(request);
  const payload = getUserFromToken(token);

  if (!payload) {
    throw new UnauthorizedError('Authentication required');
  }

  return payload;
}

/**
 * Alternative middleware that throws errors for role verification.
 * Use this with withApiLogger for cleaner error handling.
 * 
 * @example
 * ```typescript
 * import { withApiLogger } from '@/lib/api-logger';
 * import { requireRole } from '@/lib/middleware';
 * 
 * async function handler(request: Request) {
 *   const payload = requireRole(request, 'admin');
 *   // ... rest of handler
 * }
 * 
 * export const GET = withApiLogger(handler);
 * ```
 */
export function requireRole(request: Request, requiredRole: UserRole | UserRole[]) {
  const payload = requireAuth(request);

  if (!hasRole(payload.role, requiredRole)) {
    throw new ForbiddenError('Insufficient permissions');
  }

  return payload;
}

/**
 * Alternative middleware that throws errors for admin verification.
 * Use this with withApiLogger for cleaner error handling.
 */
export function requireAdmin(request: Request) {
  return requireRole(request, 'admin');
}

/**
 * Alternative middleware that throws errors for vendor/admin verification.
 * Use this with withApiLogger for cleaner error handling.
 */
export function requireVendorOrAdmin(request: Request) {
  return requireRole(request, ['vendor', 'admin']);
}

/**
 * Higher-order function that wraps an async handler with role checking.
 * Use this to protect route handlers that require specific roles.
 * 
 * @example
 * ```typescript
 * import { withApiLogger } from '@/lib/api-logger';
 * import { withRoleCheck } from '@/lib/middleware';
 * 
 * async function handler(request: Request) {
 *   // Handler code - user is guaranteed to have required role
 * }
 * 
 * export const GET = withApiLogger(withRoleCheck(handler, ['admin']));
 * ```
 */
export function withRoleCheck<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<NextResponse>,
  requiredRole: UserRole | UserRole[]
) {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    const authResult = withRole(request, requiredRole);
    
    if (authResult.error) {
      return authResult.error;
    }
    
    return handler(request, ...args);
  };
}
