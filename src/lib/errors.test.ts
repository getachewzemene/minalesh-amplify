/**
 * Tests for Custom Error Handling
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  formatErrorResponse,
  createErrorResponse,
  handleApiError,
} from './errors';

describe('AppError', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', true);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
  });

  it('should use default values when not provided', () => {
    const error = new AppError('Test error');
    
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.errorCode).toBeUndefined();
  });

  it('should capture stack trace', () => {
    const error = new AppError('Test error');
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('should support additional details', () => {
    const details = { field: 'email', value: 'invalid' };
    const error = new AppError('Validation error', 400, 'VALIDATION_ERROR', true, details);
    
    expect(error.details).toEqual(details);
  });
});

describe('BadRequestError', () => {
  it('should create a 400 error', () => {
    const error = new BadRequestError('Invalid input');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('BadRequestError');
  });

  it('should use default message', () => {
    const error = new BadRequestError();
    
    expect(error.message).toBe('Bad Request');
  });

  it('should support error code and details', () => {
    const error = new BadRequestError('Invalid field', 'INVALID_FIELD', { field: 'email' });
    
    expect(error.errorCode).toBe('INVALID_FIELD');
    expect(error.details).toEqual({ field: 'email' });
  });
});

describe('UnauthorizedError', () => {
  it('should create a 401 error', () => {
    const error = new UnauthorizedError('Authentication required');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
    expect(error.name).toBe('UnauthorizedError');
  });

  it('should use default message', () => {
    const error = new UnauthorizedError();
    
    expect(error.message).toBe('Unauthorized');
  });
});

describe('ForbiddenError', () => {
  it('should create a 403 error', () => {
    const error = new ForbiddenError('Access denied');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access denied');
    expect(error.name).toBe('ForbiddenError');
  });
});

describe('NotFoundError', () => {
  it('should create a 404 error', () => {
    const error = new NotFoundError('Product not found');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Product not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('should support details', () => {
    const error = new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: '123' });
    
    expect(error.details).toEqual({ productId: '123' });
  });
});

describe('ConflictError', () => {
  it('should create a 409 error', () => {
    const error = new ConflictError('Email already exists');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Email already exists');
    expect(error.name).toBe('ConflictError');
  });
});

describe('InternalServerError', () => {
  it('should create a 500 error', () => {
    const error = new InternalServerError('Database connection failed');
    
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Database connection failed');
    expect(error.isOperational).toBe(false);
    expect(error.name).toBe('InternalServerError');
  });
});

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new BadRequestError('Invalid input', 'INVALID_INPUT', { field: 'email' });
    const response = formatErrorResponse(error);
    
    expect(response).toEqual({
      error: 'Invalid input',
      errorCode: 'INVALID_INPUT',
      details: { field: 'email' },
    });
  });

  it('should format AppError without optional fields', () => {
    const error = new BadRequestError('Invalid input');
    const response = formatErrorResponse(error);
    
    expect(response).toEqual({
      error: 'Invalid input',
    });
  });

  it('should include stack trace when requested', () => {
    const error = new AppError('Test error');
    const response = formatErrorResponse(error, true);
    
    expect(response.error).toBe('Test error');
    expect(response.stack).toBeDefined();
    expect(response.stack).toContain('AppError');
  });

  it('should format standard Error', () => {
    const error = new Error('Standard error');
    const response = formatErrorResponse(error);
    
    expect(response).toEqual({
      error: 'Internal Server Error',
    });
  });

  it('should format standard Error with stack in development', () => {
    const error = new Error('Standard error');
    const response = formatErrorResponse(error, true);
    
    expect(response.error).toBe('Standard error');
    expect(response.stack).toBeDefined();
  });
});

describe('createErrorResponse', () => {
  it('should create NextResponse with correct status for AppError', () => {
    const error = new NotFoundError('Product not found');
    const response = createErrorResponse(error);
    
    expect(response.status).toBe(404);
  });

  it('should create NextResponse with 500 for standard Error', () => {
    const error = new Error('Standard error');
    const response = createErrorResponse(error);
    
    expect(response.status).toBe(500);
  });

  it('should include stack in development mode for 5xx errors', () => {
    const error = new InternalServerError('Database error');
    const response = createErrorResponse(error, true);
    
    expect(response.status).toBe(500);
  });

  it('should not include stack in production mode', () => {
    const error = new InternalServerError('Database error');
    const response = createErrorResponse(error, false);
    
    expect(response.status).toBe(500);
  });
});

describe('handleApiError', () => {
  it('should handle AppError correctly', () => {
    const error = new NotFoundError('Product not found');
    const response = handleApiError(error);
    
    expect(response.status).toBe(404);
  });

  it('should convert "not found" message to NotFoundError', () => {
    const error = new Error('Product not found');
    const response = handleApiError(error);
    
    expect(response.status).toBe(404);
  });

  it('should convert "Unauthorized" message to UnauthorizedError', () => {
    const error = new Error('Unauthorized');
    const response = handleApiError(error);
    
    expect(response.status).toBe(401);
  });

  it('should convert "Insufficient stock" message to BadRequestError', () => {
    const error = new Error('Insufficient stock');
    const response = handleApiError(error);
    
    expect(response.status).toBe(400);
  });

  it('should handle standard Error as InternalServerError', () => {
    const error = new Error('Database connection failed');
    const response = handleApiError(error);
    
    expect(response.status).toBe(500);
  });

  it('should handle unknown error types', () => {
    const error = 'string error';
    const response = handleApiError(error);
    
    expect(response.status).toBe(500);
  });

  it('should use default message for unknown errors', () => {
    const error = null;
    const response = handleApiError(error, 'Custom default message');
    
    expect(response.status).toBe(500);
  });
});
