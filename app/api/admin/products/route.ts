import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { logApiRequest, logError, logEvent } from '@/lib/logger';
import { invalidateCache } from '@/lib/cache';

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

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              isVendor: true,
              vendorStatus: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        vendor: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Invalidate product caches
    await invalidateCache(/^products:/, { prefix: 'products' });
    await invalidateCache(/^search:/, { prefix: 'products' });

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

    await prisma.product.delete({
      where: { id },
    });

    // Invalidate product caches
    await invalidateCache(/^products:/, { prefix: 'products' });
    await invalidateCache(/^search:/, { prefix: 'products' });

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
