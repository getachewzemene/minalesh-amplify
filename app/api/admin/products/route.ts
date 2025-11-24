import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import { logApiRequest, logError, logEvent } from '@/lib/logger';
import * as ProductService from '@/services/ProductService';

// Get all products for admin (with pagination and filtering)
export async function GET(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');

    const result = await ProductService.getProducts({
      page,
      limit,
      search,
      category,
      isActive: isActive !== null && isActive !== '' ? isActive === 'true' : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// Update product (admin can update any product)
export async function PATCH(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  const startTime = Date.now();

  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await ProductService.updateProduct({ id, ...data });

    // Log the update event
    logEvent('product_updated', {
      productId: id,
      adminId: payload?.userId,
      changes: Object.keys(data),
    });

    logApiRequest({
      method: 'PATCH',
      path: '/api/admin/products',
      statusCode: 200,
      duration: Date.now() - startTime,
      userId: payload?.userId,
    });

    return NextResponse.json(product);
  } catch (error) {
    const err = error as Error;
    logError(err, {
      method: 'PATCH',
      path: '/api/admin/products',
      userId: payload?.userId,
    });
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// Delete product (admin can delete any product)
export async function DELETE(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await ProductService.deleteProduct(id);

    // Log the delete event
    logEvent('product_deleted', {
      productId: id,
      adminId: payload?.userId,
    });

    logApiRequest({
      method: 'DELETE',
      path: '/api/admin/products',
      statusCode: 200,
      duration: Date.now() - startTime,
      userId: payload?.userId,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    const err = error as Error;
    logError(err, {
      method: 'DELETE',
      path: '/api/admin/products',
      userId: payload?.userId,
    });
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
