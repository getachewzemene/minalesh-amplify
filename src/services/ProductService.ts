/**
 * Product Service
 * 
 * Handles product CRUD operations, vendor authorization,
 * and product queries.
 */

import prisma from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache';

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  stockQuantity?: number;
  categoryId: string;
  images?: string[];
  sku?: string;
  vendorId: string;
}

export interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  salePrice?: number;
  stockQuantity?: number;
  categoryId?: string;
  images?: string[];
  sku?: string;
  isActive?: boolean;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean | null;
  vendorId?: string;
}

/**
 * Get vendor's products
 */
export async function getVendorProducts(vendorId: string) {
  return await prisma.product.findMany({
    where: { vendorId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all products with pagination and filtering (admin)
 */
export async function getProducts(options: ProductQueryOptions) {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    isActive = null,
    vendorId,
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (vendorId) {
    where.vendorId = vendorId;
  }

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

  if (isActive !== null && isActive !== undefined) {
    where.isActive = isActive;
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

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductRequest) {
  // Note: Using type assertion here as Prisma types don't fully align with our request interface
  // This is safe as the data structure matches the Product model
  const product = await prisma.product.create({
    data: data as any,
  });

  // Invalidate product caches
  await invalidateCache(/^products:/, { prefix: 'products' });
  await invalidateCache(/^search:/, { prefix: 'products' });

  return product;
}

/**
 * Update a product
 */
export async function updateProduct(data: UpdateProductRequest, requestingVendorId?: string) {
  const { id, ...updateData } = data;

  // Verify product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Verify vendor ownership if vendorId is provided
  if (requestingVendorId && existingProduct.vendorId !== requestingVendorId) {
    throw new Error('Not authorized to update this product');
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
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

  return product;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string, requestingVendorId?: string) {
  // Verify product exists and ownership
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Verify vendor ownership if vendorId is provided
  if (requestingVendorId && existingProduct.vendorId !== requestingVendorId) {
    throw new Error('Not authorized to delete this product');
  }

  await prisma.product.delete({
    where: { id },
  });

  // Invalidate product caches
  await invalidateCache(/^products:/, { prefix: 'products' });
  await invalidateCache(/^search:/, { prefix: 'products' });

  return { success: true };
}

/**
 * Get product by ID
 */
export async function getProductById(id: string) {
  return await prisma.product.findUnique({
    where: { id },
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
}

/**
 * Check product availability
 */
export async function checkProductAvailability(productId: string, quantity: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true },
  });

  if (!product) {
    return { available: false, reason: 'Product not found' };
  }

  if (product.stockQuantity < quantity) {
    return { 
      available: false, 
      reason: 'Insufficient stock',
      availableQuantity: product.stockQuantity 
    };
  }

  return { available: true };
}
