/**
 * API Logging Middleware
 * 
 * Provides structured logging for API routes with request/response tracking,
 * performance metrics, and error handling.
 */

import { NextResponse } from 'next/server';
import { logApiRequest, logError } from './logger';
import * as Sentry from '@sentry/nextjs';
import { getCorrelationId, CORRELATION_ID_HEADER } from './correlation';
import { AppError, handleApiError } from './errors';

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
    
    // Get or generate correlation ID for request tracking
    const correlationId = getCorrelationId(request);

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
        correlationId,
        query: Object.fromEntries(url.searchParams),
      });

      // Add performance and correlation headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set(CORRELATION_ID_HEADER, correlationId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      // Determine status code (use AppError statusCode if available, otherwise 500)
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      // Log the error
      logError(err, {
        method,
        path,
        duration,
        userId,
        correlationId,
        statusCode,
      });

      // Report to Sentry based on error severity:
      // - All 5xx errors (server errors should always be investigated)
      // - Non-operational errors (unexpected errors regardless of status code)
      // - Skip operational 4xx errors (expected client errors like validation failures)
      const shouldReportToSentry = statusCode >= 500 || (error instanceof AppError && !error.isOperational);
      if (shouldReportToSentry) {
        Sentry.captureException(err, {
          extra: {
            method,
            path,
            query: url.search,
            correlationId,
            statusCode,
          },
          tags: {
            path,
            method,
            correlationId,
          },
          user: userId ? { id: userId } : undefined,
        });
      }

      // Log the failed request
      logApiRequest({
        method,
        path,
        statusCode,
        duration,
        userId,
        correlationId,
        error: err.message,
      });

      // Use centralized error handling
      const errorResponse = handleApiError(error, 'An error occurred');
      
      // Add performance and correlation headers
      errorResponse.headers.set('X-Response-Time', `${duration}ms`);
      errorResponse.headers.set(CORRELATION_ID_HEADER, correlationId);

      return errorResponse;
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
