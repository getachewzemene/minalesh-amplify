/**
 * Product Service
 * 
 * Handles product CRUD operations, vendor authorization,
 * and product queries with Redis caching support.
 */

import prisma from '@/lib/prisma';
import { invalidateCache, getOrSetCache } from '@/lib/cache';

// Cache configuration constants
const CACHE_PREFIX = 'products';
const PRODUCT_TTL = 300; // 5 minutes
const PRODUCT_STALE_TIME = 600; // 10 minutes stale-while-revalidate
const VENDOR_PRODUCTS_TTL = 180; // 3 minutes
const PRODUCT_LIST_TTL = 120; // 2 minutes

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
 * Get vendor's products with caching
 */
export async function getVendorProducts(vendorId: string) {
  const cacheKey = `vendor:${vendorId}:list`;
  
  return await getOrSetCache(
    cacheKey,
    async () => {
      return await prisma.product.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
      });
    },
    {
      ttl: VENDOR_PRODUCTS_TTL,
      staleTime: VENDOR_PRODUCTS_TTL * 2,
      prefix: CACHE_PREFIX,
      tags: ['products', `vendor:${vendorId}`],
    }
  );
}

/**
 * Get all products with pagination and filtering (admin) with caching
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

  // Generate cache key based on query parameters
  const cacheKey = `list:${JSON.stringify({ page, limit, search, category, isActive, vendorId })}`;

  return await getOrSetCache(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};
      
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
    },
    {
      ttl: PRODUCT_LIST_TTL,
      staleTime: PRODUCT_LIST_TTL * 2,
      prefix: CACHE_PREFIX,
      tags: ['products', 'list'],
    }
  );
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductRequest) {
  const product = await prisma.product.create({
    // Type assertion needed as CreateProductRequest is a simplified interface
    // that doesn't include all Prisma fields like slug generation
    data: {
      ...data,
      slug: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    },
  });

  // Invalidate product list caches and vendor-specific caches
  await invalidateProductCaches(data.vendorId);

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

  // Invalidate product caches including specific product cache
  await invalidateProductCaches(existingProduct.vendorId, id);

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

  // Invalidate product caches including specific product cache
  await invalidateProductCaches(existingProduct.vendorId, id);

  return { success: true };
}

/**
 * Helper function to invalidate product-related caches
 */
async function invalidateProductCaches(vendorId?: string, productId?: string): Promise<void> {
  // Invalidate all product list caches
  await invalidateCache(/^products:list:/, { prefix: '' });
  
  // Invalidate search caches
  await invalidateCache(/^products:search:/, { prefix: '' });
  
  // Invalidate vendor-specific product cache
  if (vendorId) {
    await invalidateCache(`vendor:${vendorId}:list`, { prefix: CACHE_PREFIX });
  }
  
  // Invalidate specific product cache
  if (productId) {
    await invalidateCache(`id:${productId}`, { prefix: CACHE_PREFIX });
  }
}

/**
 * Get product by ID with caching
 */
export async function getProductById(id: string) {
  const cacheKey = `id:${id}`;
  
  return await getOrSetCache(
    cacheKey,
    async () => {
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
    },
    {
      ttl: PRODUCT_TTL,
      staleTime: PRODUCT_STALE_TIME,
      prefix: CACHE_PREFIX,
      tags: ['products', `product:${id}`],
    }
  );
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
