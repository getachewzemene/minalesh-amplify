import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getTokenFromRequest, getUserFromToken, hasRole } from './auth';

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
