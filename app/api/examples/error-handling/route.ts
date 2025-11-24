/**
 * Example API Route - Error Handling Demonstration
 * 
 * This route demonstrates how to use the centralized error handling system.
 * It shows examples of different error types and how they're handled consistently.
 * 
 * @example
 * GET /api/examples/error-handling?type=notfound
 * GET /api/examples/error-handling?type=badrequest
 * GET /api/examples/error-handling?type=unauthorized
 * GET /api/examples/error-handling?type=forbidden
 * GET /api/examples/error-handling?type=conflict
 * GET /api/examples/error-handling?type=servererror
 * GET /api/examples/error-handling?type=success
 */

import { NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/api-logger';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '@/lib/errors';

/**
 * @swagger
 * /api/examples/error-handling:
 *   get:
 *     summary: Error handling demonstration
 *     description: Demonstrates centralized error handling with different error types
 *     tags: [Examples]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [success, badrequest, unauthorized, forbidden, notfound, conflict, servererror]
 *         description: Type of response to demonstrate
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Bad request error
 *       401:
 *         description: Unauthorized error
 *       403:
 *         description: Forbidden error
 *       404:
 *         description: Not found error
 *       409:
 *         description: Conflict error
 *       500:
 *         description: Internal server error
 */
async function handler(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type')?.toLowerCase();

  switch (errorType) {
    case 'badrequest':
      // Example: Client sent invalid data
      throw new BadRequestError(
        'Invalid product data provided',
        'INVALID_PRODUCT_DATA',
        {
          missingFields: ['name', 'price'],
          providedFields: ['description'],
        }
      );

    case 'unauthorized':
      // Example: User needs to authenticate
      throw new UnauthorizedError(
        'Authentication required to access this resource',
        'AUTH_REQUIRED'
      );

    case 'forbidden':
      // Example: User is authenticated but lacks permission
      throw new ForbiddenError(
        'Insufficient permissions to perform this action',
        'INSUFFICIENT_PERMISSIONS'
      );

    case 'notfound':
      // Example: Requested resource doesn't exist
      throw new NotFoundError(
        'Product not found',
        'PRODUCT_NOT_FOUND',
        {
          productId: '123456',
          searchedIn: 'products',
        }
      );

    case 'conflict':
      // Example: Resource already exists
      throw new ConflictError(
        'A product with this SKU already exists',
        'DUPLICATE_SKU',
        {
          sku: 'ABC-123',
          existingProductId: '789',
        }
      );

    case 'servererror':
      // Example: Unexpected server error
      throw new InternalServerError(
        'Database connection failed',
        'DB_CONNECTION_ERROR',
        {
          host: 'localhost',
          port: 5432,
        }
      );

    case 'success':
    default:
      // Example: Successful response
      return NextResponse.json({
        message: 'Error handling demonstration',
        availableTypes: [
          'success',
          'badrequest',
          'unauthorized',
          'forbidden',
          'notfound',
          'conflict',
          'servererror',
        ],
        usage: 'Add ?type=<errorType> to the URL to see different error responses',
        examples: {
          badRequest: '/api/examples/error-handling?type=badrequest',
          unauthorized: '/api/examples/error-handling?type=unauthorized',
          forbidden: '/api/examples/error-handling?type=forbidden',
          notFound: '/api/examples/error-handling?type=notfound',
          conflict: '/api/examples/error-handling?type=conflict',
          serverError: '/api/examples/error-handling?type=servererror',
        },
        errorFormat: {
          basic: {
            error: 'Error message',
          },
          withCode: {
            error: 'Error message',
            errorCode: 'ERROR_CODE',
          },
          withDetails: {
            error: 'Error message',
            errorCode: 'ERROR_CODE',
            details: {
              additionalInfo: 'value',
            },
          },
        },
      });
  }
}

// Export the handler wrapped with API logger for automatic error handling
export const GET = withApiLogger(handler);
