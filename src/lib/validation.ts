/**
 * Centralized Validation Utility
 * 
 * Provides Zod-based validation for API routes with unified error responses.
 */

import { NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Unified error response structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  errors?: ValidationError[];
}

/**
 * Convert Zod errors to unified error format
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: ValidationError[],
  message: string = 'Validation failed'
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      errors,
    },
    { status: 422 }
  );
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ErrorResponse> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: validationErrorResponse(formatZodErrors(error)),
      };
    }
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: validationErrorResponse(
          [{ field: 'body', message: 'Invalid JSON' }],
          'Invalid request body'
        ),
      };
    }
    return {
      success: false,
      response: validationErrorResponse(
        [{ field: 'body', message: 'Validation error' }],
        'Request validation failed'
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: Request,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse<ErrorResponse> } {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: validationErrorResponse(formatZodErrors(error), 'Invalid query parameters'),
      };
    }
    return {
      success: false,
      response: validationErrorResponse(
        [{ field: 'query', message: 'Validation error' }],
        'Query parameter validation failed'
      ),
    };
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID validation
  id: z.string().min(1, 'ID is required'),
  
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  }),
  
  // Email
  email: z.string().email('Invalid email address'),
  
  // Password
  password: z.string().min(8, 'Password must be at least 8 characters'),
  
  // Quantity
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  
  // Price
  price: z.number().nonnegative('Price must be non-negative'),
  
  // Date
  date: z.string().datetime('Invalid date format'),
};

/**
 * Validation schemas for common API endpoints
 */

// Auth schemas
export const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    referralCode: z.string().optional(),
  }),
  
  registerVendor: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    tradeLicense: z.string().min(1, 'Trade license is required'),
    tinNumber: z.string().min(1, 'TIN number is required'),
    phone: z.string().optional(),
  }),
  
  passwordReset: z.object({
    email: commonSchemas.email,
  }),
  
  passwordResetConfirm: z.object({
    token: z.string().min(1, 'Token is required'),
    password: commonSchemas.password,
  }),
};

// Cart schemas
export const cartSchemas = {
  addItem: z.object({
    productId: commonSchemas.id,
    variantId: z.string().optional(),
    quantity: commonSchemas.quantity.default(1),
  }),
  
  updateItem: z.object({
    quantity: commonSchemas.quantity,
  }),
  
  calculate: z.object({
    subtotal: commonSchemas.price,
    couponCode: z.string().optional(),
    shippingRateId: z.string().optional(),
    shippingAddress: z.object({
      country: z.string().min(1, 'Country is required'),
      state: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
    }).optional(),
    totalWeight: z.number().optional(),
  }),
};

// Product schemas
export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    price: commonSchemas.price,
    salePrice: z.number().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative'),
    sku: z.string().optional(),
    categoryId: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
  
  update: z.object({
    id: commonSchemas.id,
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: commonSchemas.price.optional(),
    salePrice: z.number().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    categoryId: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
  
  list: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    categoryId: z.string().optional(),
    search: z.string().optional(),
  }),
};

// Order schemas
export const orderSchemas = {
  create: z.object({
    shippingAddressId: z.string().optional(),
    shippingAddress: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      addressLine1: z.string().min(1, 'Address is required'),
      addressLine2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional(),
      postalCode: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
      phone: z.string().min(1, 'Phone is required'),
    }).optional(),
    paymentMethodId: z.string().optional(),
    couponCode: z.string().optional(),
  }),
};

// Payment schemas
export const paymentSchemas = {
  createIntent: z.object({
    amount: commonSchemas.price,
    currency: z.string().length(3, 'Currency must be 3 characters'),
    orderId: z.string().optional(),
  }),
  
  webhook: z.object({
    provider: z.string().min(1, 'Provider is required'),
    status: z.string().min(1, 'Status is required'),
    paymentReference: z.string().min(1, 'Payment reference is required'),
    amount: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }),
};
