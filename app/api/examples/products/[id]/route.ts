/**
 * Example API Route - Product by ID (demonstrates error handling)
 * 
 * This is a real-world example showing how to use the centralized error handling
 * with authentication, authorization, and data validation.
 * 
 * @example
 * GET /api/examples/products/123
 * PATCH /api/examples/products/123
 * DELETE /api/examples/products/123
 */

import { NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/api-logger';
import { requireAuth } from '@/lib/middleware';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';

// Mock product database for demonstration
const mockProducts = new Map([
  ['123', { id: '123', name: 'Example Product 1', price: 29.99, vendorId: 'vendor1' }],
  ['456', { id: '456', name: 'Example Product 2', price: 49.99, vendorId: 'vendor2' }],
]);

/**
 * GET /api/examples/products/[id]
 * Retrieve a product by ID
 */
async function getHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // No authentication required for viewing products
  const { id } = params;

  // Validate ID format
  if (!id || id.length < 3) {
    throw new BadRequestError(
      'Invalid product ID format',
      'INVALID_PRODUCT_ID',
      { providedId: id, minLength: 3 }
    );
  }

  // Get product from mock database
  const product = mockProducts.get(id);

  if (!product) {
    throw new NotFoundError(
      'Product not found',
      'PRODUCT_NOT_FOUND',
      { productId: id }
    );
  }

  return NextResponse.json(product);
}

/**
 * PATCH /api/examples/products/[id]
 * Update a product (requires authentication and ownership)
 */
async function patchHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Require authentication
  const user = requireAuth(request);

  const { id } = params;

  // Validate ID
  if (!id) {
    throw new BadRequestError('Product ID is required', 'MISSING_PRODUCT_ID');
  }

  // Get product
  const product = mockProducts.get(id);

  if (!product) {
    throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: id });
  }

  // Check if user is the vendor who owns this product
  // NOTE: This is a mock example. In a real application, you would:
  // 1. Get the user's profile to find their vendorId
  // 2. Compare product.vendorId with user's actual vendorId
  // Example: const profile = await prisma.profile.findUnique({ where: { userId: user.userId } });
  //          const isOwner = profile?.id === product.vendorId;
  const mockVendorId = 'vendor1'; // In real app: get from user profile
  const isOwner = product.vendorId === mockVendorId;

  if (!isOwner) {
    throw new ForbiddenError(
      'You do not have permission to update this product',
      'NOT_PRODUCT_OWNER',
      { productId: id, userId: user.userId }
    );
  }

  // Parse and validate update data
  const updateData = await request.json();

  if (updateData.price !== undefined) {
    if (typeof updateData.price !== 'number' || updateData.price < 0) {
      throw new BadRequestError(
        'Invalid price value',
        'INVALID_PRICE',
        { providedPrice: updateData.price }
      );
    }
  }

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
      throw new BadRequestError(
        'Product name cannot be empty',
        'INVALID_NAME',
        { providedName: updateData.name }
      );
    }
  }

  // Update product (mock)
  const updatedProduct = { ...product, ...updateData };
  mockProducts.set(id, updatedProduct);

  return NextResponse.json(updatedProduct);
}

/**
 * DELETE /api/examples/products/[id]
 * Delete a product (requires authentication and ownership)
 */
async function deleteHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Require authentication
  const user = requireAuth(request);

  const { id } = params;

  // Validate ID
  if (!id) {
    throw new BadRequestError('Product ID is required', 'MISSING_PRODUCT_ID');
  }

  // Get product
  const product = mockProducts.get(id);

  if (!product) {
    throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND', { productId: id });
  }

  // Check ownership (see PATCH handler for explanation of mock data)
  const mockVendorId = 'vendor1'; // In real app: get from user profile
  const isOwner = product.vendorId === mockVendorId;

  if (!isOwner) {
    throw new ForbiddenError(
      'You do not have permission to delete this product',
      'NOT_PRODUCT_OWNER',
      { productId: id, userId: user.userId }
    );
  }

  // Delete product (mock)
  mockProducts.delete(id);

  return NextResponse.json({
    success: true,
    message: 'Product deleted successfully',
  });
}

// Export handlers wrapped with API logger
// The withApiLogger automatically handles all thrown errors
export const GET = withApiLogger(getHandler);
export const PATCH = withApiLogger(patchHandler);
export const DELETE = withApiLogger(deleteHandler);
