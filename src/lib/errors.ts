/**
 * Custom Error Handling
 * 
 * Provides centralized error handling with custom error classes
 * and consistent error responses across the application.
 */

import { NextResponse } from 'next/server';

/**
 * Custom application error class
 * Extends the native Error class with additional properties for HTTP status codes and error codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types for convenience
 */

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errorCode?: string, details?: Record<string, any>) {
    super(message, 400, errorCode, true, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode?: string) {
    super(message, 401, errorCode, true);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errorCode?: string) {
    super(message, 403, errorCode, true);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode?: string, details?: Record<string, any>) {
    super(message, 404, errorCode, true, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errorCode?: string, details?: Record<string, any>) {
    super(message, 409, errorCode, true, details);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', errorCode?: string, details?: Record<string, any>) {
    super(message, 500, errorCode, false, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: Error | AppError, includeStack: boolean = false) {
  if (error instanceof AppError) {
    const response: Record<string, any> = {
      error: error.message,
    };

    if (error.errorCode) {
      response.errorCode = error.errorCode;
    }

    if (error.details) {
      response.details = error.details;
    }

    if (includeStack && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  // For non-AppError errors, return generic error response
  return {
    error: includeStack ? error.message : 'Internal Server Error',
    ...(includeStack && error.stack ? { stack: error.stack } : {}),
  };
}

/**
 * Create error response with proper status code
 */
export function createErrorResponse(error: Error | AppError, isDevelopment: boolean = false) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const includeStack = isDevelopment && statusCode >= 500;
  
  return NextResponse.json(
    formatErrorResponse(error, includeStack),
    { status: statusCode }
  );
}

/**
 * Error handler wrapper for API routes
 * Integrates with existing error handling patterns
 */
export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred'): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle known AppError instances
  if (error instanceof AppError) {
    return createErrorResponse(error, isDevelopment);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for common error messages and convert to AppError
    // Note: This provides backward compatibility with existing error patterns
    // For new code, prefer throwing AppError directly
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return createErrorResponse(new NotFoundError(error.message), isDevelopment);
    }
    
    // Check for exact unauthorized message (case-sensitive for safety)
    if (error.message === 'Unauthorized' || error.message === 'Authentication required') {
      return createErrorResponse(new UnauthorizedError(error.message), isDevelopment);
    }

    // Check for specific validation/business rule errors
    if (error.message.includes('Insufficient stock') || 
        error.message.startsWith('Invalid ') ||
        error.message.includes('is required')) {
      return createErrorResponse(new BadRequestError(error.message), isDevelopment);
    }

    // For other errors, return as internal server error
    return createErrorResponse(
      new InternalServerError(isDevelopment ? error.message : defaultMessage),
      isDevelopment
    );
  }

  // Handle unknown error types
  return createErrorResponse(
    new InternalServerError(defaultMessage),
    isDevelopment
  );
}
