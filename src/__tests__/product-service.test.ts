/**
 * Unit Tests: Product Service
 * 
 * Tests for product CRUD operations, vendor authorization,
 * caching, and product queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => {
  return {
    default: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/cache', () => ({
  getOrSetCache: vi.fn((key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn(() => Promise.resolve()),
}));

import prisma from '@/lib/prisma';
import { invalidateCache, getOrSetCache } from '@/lib/cache';
import {
  getVendorProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  checkProductAvailability,
} from '@/services/ProductService';

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVendorProducts', () => {
    it('should return vendor products', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', vendorId: 'vendor-1' },
        { id: 'prod-2', name: 'Product 2', vendorId: 'vendor-1' },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await getVendorProducts('vendor-1');

      expect(result).toHaveLength(2);
      expect(getOrSetCache).toHaveBeenCalledWith(
        'vendor:vendor-1:list',
        expect.any(Function),
        expect.objectContaining({
          prefix: 'products',
          tags: ['products', 'vendor:vendor-1'],
        })
      );
    });

    it('should return empty array for vendor with no products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      const result = await getVendorProducts('vendor-no-products');

      expect(result).toEqual([]);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(2);

      const result = await getProducts({ page: 1, limit: 10 });

      expect(result.products).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply search filter', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await getProducts({ search: 'test product' });

      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await getProducts({ category: 'electronics' });

      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should apply vendor filter', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await getProducts({ vendorId: 'vendor-1' });

      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should apply isActive filter', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await getProducts({ isActive: true });

      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should calculate correct pagination', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(50);

      const result = await getProducts({ page: 3, limit: 10 });

      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.page).toBe(3);
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const result = await getProducts({});

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        price: 99.99,
        stockQuantity: 100,
        categoryId: 'cat-1',
        vendorId: 'vendor-1',
      };

      const createdProduct = {
        id: 'prod-new',
        ...productData,
        slug: 'new-product-123456',
      };

      vi.mocked(prisma.product.create).mockResolvedValue(createdProduct as any);

      const result = await createProduct(productData);

      expect(prisma.product.create).toHaveBeenCalled();
      expect(result.name).toBe('New Product');
      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should generate slug from product name', async () => {
      const productData = {
        name: 'Test Product With Spaces',
        price: 50,
        categoryId: 'cat-1',
        vendorId: 'vendor-1',
      };

      vi.mocked(prisma.product.create).mockImplementation(async (args: any) => {
        return {
          id: 'prod-new',
          ...args.data,
        };
      });

      const result = await createProduct(productData);

      expect(result.slug).toContain('test-product-with-spaces');
    });

    it('should invalidate product caches after creation', async () => {
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'prod-1' } as any);

      await createProduct({
        name: 'New Product',
        price: 100,
        categoryId: 'cat-1',
        vendorId: 'vendor-1',
      });

      expect(invalidateCache).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const existingProduct = {
        id: 'prod-1',
        name: 'Old Name',
        vendorId: 'vendor-1',
      };

      const updatedProduct = {
        ...existingProduct,
        name: 'New Name',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct as any);

      const result = await updateProduct({ id: 'prod-1', name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        updateProduct({ id: 'nonexistent', name: 'Test' })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when vendor not authorized', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'vendor-1',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);

      await expect(
        updateProduct({ id: 'prod-1', name: 'Test' }, 'vendor-2')
      ).rejects.toThrow('Not authorized to update this product');
    });

    it('should allow update when vendor is owner', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'vendor-1',
      };

      const updatedProduct = {
        ...existingProduct,
        name: 'Updated',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct as any);

      const result = await updateProduct({ id: 'prod-1', name: 'Updated' }, 'vendor-1');

      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteProduct', () => {
    it('should delete an existing product', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'vendor-1',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.delete).mockResolvedValue({} as any);

      const result = await deleteProduct('prod-1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(result.success).toBe(true);
      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(deleteProduct('nonexistent')).rejects.toThrow('Product not found');
    });

    it('should throw error when vendor not authorized', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'vendor-1',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);

      await expect(
        deleteProduct('prod-1', 'vendor-2')
      ).rejects.toThrow('Not authorized to delete this product');
    });

    it('should allow delete when vendor is owner', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'vendor-1',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.delete).mockResolvedValue({} as any);

      const result = await deleteProduct('prod-1', 'vendor-1');

      expect(result.success).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        vendor: { displayName: 'Test Vendor' },
        category: { name: 'Electronics', slug: 'electronics' },
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      const result = await getProductById('prod-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('prod-1');
      expect(getOrSetCache).toHaveBeenCalledWith(
        'id:prod-1',
        expect.any(Function),
        expect.objectContaining({
          prefix: 'products',
        })
      );
    });

    it('should return null for non-existent product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const result = await getProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('checkProductAvailability', () => {
    it('should return available for product with sufficient stock', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        stockQuantity: 50,
      } as any);

      const result = await checkProductAvailability('prod-1', 10);

      expect(result.available).toBe(true);
    });

    it('should return unavailable for product with insufficient stock', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        stockQuantity: 5,
      } as any);

      const result = await checkProductAvailability('prod-1', 10);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Insufficient stock');
      expect(result.availableQuantity).toBe(5);
    });

    it('should return unavailable for non-existent product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const result = await checkProductAvailability('nonexistent', 1);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Product not found');
    });

    it('should handle exact stock match', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        stockQuantity: 10,
      } as any);

      const result = await checkProductAvailability('prod-1', 10);

      expect(result.available).toBe(true);
    });

    it('should handle zero stock', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        stockQuantity: 0,
      } as any);

      const result = await checkProductAvailability('prod-1', 1);

      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(0);
    });
  });
});
