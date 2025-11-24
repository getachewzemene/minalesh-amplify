# Centralized Error Handling Guide

This guide explains how to use the centralized error handling system in the Minalesh Amplify application.

## Overview

The application now has a centralized error handling system that provides:
- Consistent error responses across all API routes
- Type-safe error handling with TypeScript
- Better debugging with error codes and additional details
- Automatic Sentry integration for critical errors
- Backward compatibility with existing patterns

## AppError Class

The `AppError` class is the base class for all application errors. It extends the native JavaScript `Error` class with additional properties:

```typescript
class AppError extends Error {
  statusCode: number;        // HTTP status code (e.g., 400, 404, 500)
  errorCode?: string;        // Optional machine-readable error code
  isOperational: boolean;    // Whether the error is expected/operational
  details?: Record<string, any>; // Additional error context
}
```

## Specialized Error Classes

The system provides convenient error classes for common HTTP status codes:

### BadRequestError (400)
Use for validation errors or malformed requests.

```typescript
import { BadRequestError } from '@/lib/errors';

throw new BadRequestError('Product ID is required');
throw new BadRequestError('Invalid email format', 'INVALID_EMAIL', { field: 'email' });
```

### UnauthorizedError (401)
Use when authentication is required but not provided.

```typescript
import { UnauthorizedError } from '@/lib/errors';

throw new UnauthorizedError('Authentication required');
throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
```

### ForbiddenError (403)
Use when the user is authenticated but doesn't have permission.

```typescript
import { ForbiddenError } from '@/lib/errors';

throw new ForbiddenError('Insufficient permissions');
throw new ForbiddenError('Not authorized as vendor', 'VENDOR_REQUIRED');
```

### NotFoundError (404)
Use when a requested resource doesn't exist.

```typescript
import { NotFoundError } from '@/lib/errors';

throw new NotFoundError('Product not found');
throw new NotFoundError('User not found', 'USER_NOT_FOUND', { userId: id });
```

### ConflictError (409)
Use when a request conflicts with existing data.

```typescript
import { ConflictError } from '@/lib/errors';

throw new ConflictError('Email already exists');
throw new ConflictError('SKU already in use', 'DUPLICATE_SKU', { sku: product.sku });
```

### InternalServerError (500)
Use for unexpected server errors (rarely needed, as unhandled errors are automatically treated as 500).

```typescript
import { InternalServerError } from '@/lib/errors';

throw new InternalServerError('Database connection failed');
```

## Usage Patterns

### Pattern 1: Using with withApiLogger (Recommended)

The `withApiLogger` middleware automatically handles all errors thrown in your handler:

```typescript
import { withApiLogger } from '@/lib/api-logger';
import { NotFoundError, BadRequestError } from '@/lib/errors';

async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new BadRequestError('Product ID is required', 'MISSING_PRODUCT_ID');
  }

  const product = await getProduct(id);
  
  if (!product) {
    throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: id });
  }

  return NextResponse.json(product);
}

export const GET = withApiLogger(handler);
```

### Pattern 2: Manual Error Handling

If you need to handle errors manually (not wrapped with `withApiLogger`):

```typescript
import { handleApiError, NotFoundError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const product = await getProduct(id);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 3: Service Layer

Throw errors from service functions, and let the API route handler catch them:

```typescript
// In ProductService.ts
import { NotFoundError, BadRequestError } from '@/lib/errors';

export async function getProductById(id: string) {
  if (!id) {
    throw new BadRequestError('Product ID is required');
  }

  const product = await prisma.product.findUnique({ where: { id } });
  
  if (!product) {
    throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: id });
  }

  return product;
}

// In route.ts
import { withApiLogger } from '@/lib/api-logger';
import * as ProductService from '@/services/ProductService';

async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')!;

  // Errors thrown by ProductService are automatically handled
  const product = await ProductService.getProductById(id);

  return NextResponse.json(product);
}

export const GET = withApiLogger(handler);
```

## Error Response Format

All errors are returned in a consistent JSON format:

### Basic Error
```json
{
  "error": "Product not found"
}
```

### Error with Code
```json
{
  "error": "Product not found",
  "errorCode": "PRODUCT_NOT_FOUND"
}
```

### Error with Details
```json
{
  "error": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "value": "invalid-email"
  }
}
```

### Development Mode (500 errors only)
In development, 500 errors include stack traces:
```json
{
  "error": "Database connection failed",
  "stack": "Error: Database connection failed\n    at ..."
}
```

## Automatic Error Conversion

The `handleApiError` function automatically converts common error messages to appropriate error types:

| Error Message Contains | Converted To | Status Code |
|------------------------|--------------|-------------|
| "not found" | NotFoundError | 404 |
| "Unauthorized" | UnauthorizedError | 401 |
| "Insufficient stock" or "Invalid" | BadRequestError | 400 |
| Other | InternalServerError | 500 |

## Sentry Integration

The error handling system is integrated with Sentry:

- **Operational errors (4xx)**: Not reported to Sentry (expected user errors)
- **Server errors (5xx)**: Automatically reported to Sentry
- **Non-operational errors**: Reported regardless of status code

This ensures Sentry only captures unexpected errors that need investigation.

## Migration Guide

### Before (Old Pattern)
```typescript
export async function GET(request: Request) {
  try {
    const product = await getProduct(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
```

### After (New Pattern)
```typescript
import { withApiLogger } from '@/lib/api-logger';
import { NotFoundError } from '@/lib/errors';

async function handler(request: Request) {
  const product = await getProduct(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return NextResponse.json(product);
}

export const GET = withApiLogger(handler);
```

## Best Practices

1. **Use specific error classes**: Use `NotFoundError`, `BadRequestError`, etc. instead of generic `AppError`

2. **Include error codes for client handling**: Error codes help clients handle errors programmatically
   ```typescript
   throw new BadRequestError('Invalid email', 'INVALID_EMAIL');
   ```

3. **Add details for debugging**: Include relevant context in the details object
   ```typescript
   throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: id });
   ```

4. **Use withApiLogger**: Wrap your handlers with `withApiLogger` for automatic error handling, logging, and Sentry integration

5. **Throw early**: Check preconditions and throw errors early in your functions

6. **Let errors bubble up**: Don't catch errors just to re-throw them; let the middleware handle them

## Testing

The error handling system includes comprehensive tests. Run them with:

```bash
npm test -- src/lib/errors.test.ts
```

## Examples

See the following files for examples of the new error handling:
- `/app/api/cart/route.ts` - Already using withApiLogger
- `/app/api/products/route.ts` - Can be updated to use new error classes
- `/src/services/ProductService.ts` - Service layer error handling

## Backward Compatibility

The new error handling system is backward compatible with existing error patterns:

- Routes using `withApiLogger` that throw regular `Error` objects will still work
- Manual try-catch blocks will continue to function
- Existing error responses will maintain the same format

You can migrate routes gradually without breaking existing functionality.
