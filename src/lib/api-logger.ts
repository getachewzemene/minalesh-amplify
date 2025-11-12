/**
 * API Logging Middleware
 * 
 * Provides structured logging for API routes with request/response tracking,
 * performance metrics, and error handling.
 */

import { NextResponse } from 'next/server';
import { logApiRequest, logError } from './logger';
import * as Sentry from '@sentry/nextjs';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  logResponse?: boolean;
}

/**
 * Wrapper for API route handlers that adds:
 * - Request/response logging
 * - Performance tracking
 * - Error handling and reporting to Sentry
 * - Structured log context
 */
export function withApiLogger<T = any>(
  handler: (request: Request, context?: any) => Promise<NextResponse<T>>,
  options: ApiHandlerOptions = {}
) {
  return async (request: Request, context?: any): Promise<NextResponse<any>> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Extract user ID if available (from token or context)
    let userId: string | undefined;
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // Attempt to decode JWT without full verification for logging purposes
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.sub;
      }
    } catch {
      // Ignore errors in user ID extraction
    }

    try {
      // Execute the handler
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Log the request
      logApiRequest({
        method,
        path,
        statusCode,
        duration,
        userId,
        query: Object.fromEntries(url.searchParams),
      });

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      // Log the error
      logError(err, {
        method,
        path,
        duration,
        userId,
      });

      // Report to Sentry
      Sentry.captureException(err, {
        contexts: {
          request: {
            method,
            url: path,
            query_string: url.search,
          },
        },
        tags: {
          path,
          method,
        },
        user: userId ? { id: userId } : undefined,
      });

      // Log the failed request
      logApiRequest({
        method,
        path,
        statusCode: 500,
        duration,
        userId,
        error: err.message,
      });

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Simplified error response helper with logging
 */
export function apiError(message: string, status: number = 500, context?: Record<string, any>) {
  logError(message, context);
  
  if (status >= 500) {
    Sentry.captureMessage(message, {
      level: 'error',
      contexts: context ? { additional: context } : undefined,
    });
  }

  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Simplified success response helper
 */
export function apiSuccess<T = any>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}
