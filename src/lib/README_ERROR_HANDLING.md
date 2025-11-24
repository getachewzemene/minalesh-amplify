# Error Handling System

## Quick Start

The centralized error handling system provides consistent error responses across all API routes.

### Basic Usage

```typescript
import { withApiLogger } from '@/lib/api-logger';
import { NotFoundError, BadRequestError } from '@/lib/errors';

async function handler(request: Request) {
  // Simply throw errors - withApiLogger will handle them
  throw new NotFoundError('Product not found');
}

export const GET = withApiLogger(handler);
```

### With Authentication

```typescript
import { withApiLogger } from '@/lib/api-logger';
import { requireAuth } from '@/lib/middleware';
import { NotFoundError } from '@/lib/errors';

async function handler(request: Request) {
  // Automatically throws UnauthorizedError if not authenticated
  const user = requireAuth(request);
  
  const product = await getProduct(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  return NextResponse.json(product);
}

export const GET = withApiLogger(handler);
```

## Available Error Classes

| Class | Status Code | Use Case |
|-------|-------------|----------|
| `BadRequestError` | 400 | Invalid input, validation errors |
| `UnauthorizedError` | 401 | Authentication required |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Duplicate data, conflicts |
| `InternalServerError` | 500 | Unexpected server errors |

## Error Properties

All error classes support these properties:

```typescript
throw new NotFoundError(
  'Product not found',           // message: Human-readable error
  'PRODUCT_NOT_FOUND',           // errorCode: Machine-readable code (optional)
  { productId: '123' }           // details: Additional context (optional)
);
```

## Response Format

Errors are returned in a consistent JSON format:

```json
{
  "error": "Product not found",
  "errorCode": "PRODUCT_NOT_FOUND",
  "details": {
    "productId": "123"
  }
}
```

## New Middleware Functions

Prefer these over the old `withAuth` pattern:

```typescript
// Old pattern (still works)
const { error, payload } = withAuth(request);
if (error) return error;

// New pattern (recommended)
const payload = requireAuth(request); // Throws UnauthorizedError
```

Available functions:
- `requireAuth(request)` - Require authentication
- `requireRole(request, role)` - Require specific role
- `requireAdmin(request)` - Require admin role
- `requireVendorOrAdmin(request)` - Require vendor or admin

## Best Practices

1. **Always use withApiLogger** - It handles errors automatically
2. **Include error codes** - Helps clients handle errors programmatically
3. **Add details for debugging** - Include relevant context
4. **Throw early** - Check preconditions at the start of handlers
5. **Let errors bubble** - Don't catch and re-throw unnecessarily

## See Also

- [Complete Error Handling Guide](../../ERROR_HANDLING_GUIDE.md)
- [Tests](./errors.test.ts)
