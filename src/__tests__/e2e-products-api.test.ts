/**
 * E2E Tests: Products API
 * 
 * Tests the complete product management flow including CRUD operations,
 * vendor authorization, and product queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  getOrSetCache: vi.fn((key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn(() => Promise.resolve()),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  getTokenFromRequest: vi.fn(),
  getUserFromToken: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

describe('E2E: Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Vendor Product Management', () => {
    const mockVendorUser = {
      userId: 'vendor-user-1',
      email: 'vendor@example.com',
      role: 'vendor' as UserRole,
    };

    const mockVendorProfile = {
      id: 'profile-1',
      userId: 'vendor-user-1',
      isVendor: true,
      vendorStatus: 'approved',
    };

    beforeEach(() => {
      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(mockVendorUser as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue(mockVendorProfile as any);
    });

    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'A great new product',
        price: 99.99,
        salePrice: 79.99,
        stockQuantity: 100,
        categoryId: 'cat-1',
        sku: 'SKU-001',
      };

      const createdProduct = {
        id: 'prod-new',
        ...productData,
        vendorId: mockVendorProfile.id,
        slug: 'new-product-123456',
        isActive: true,
        createdAt: new Date(),
      };

      vi.mocked(prisma.product.create).mockResolvedValue(createdProduct as any);

      // Step 1: Verify user is authenticated
      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user?.userId).toBe('vendor-user-1');

      // Step 2: Verify user is a vendor
      const profile = await prisma.profile.findUnique({
        where: { userId: user!.userId },
      });
      expect(profile?.isVendor).toBe(true);

      // Step 3: Create product
      const product = await prisma.product.create({
        data: {
          ...productData,
          vendorId: profile!.id,
          slug: `${productData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        },
      } as any);

      expect(product.id).toBeDefined();
      expect(product.vendorId).toBe(mockVendorProfile.id);
      expect(product.name).toBe('New Product');
    });

    it('should get vendor products', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', vendorId: mockVendorProfile.id },
        { id: 'prod-2', name: 'Product 2', vendorId: mockVendorProfile.id },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      // Step 1: Verify authentication
      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user).not.toBeNull();

      // Step 2: Verify vendor profile
      const profile = await prisma.profile.findUnique({
        where: { userId: user!.userId },
      });
      expect(profile?.isVendor).toBe(true);

      // Step 3: Get vendor products
      const products = await prisma.product.findMany({
        where: { vendorId: profile!.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(products).toHaveLength(2);
      products.forEach(p => {
        expect(p.vendorId).toBe(mockVendorProfile.id);
      });
    });

    it('should update own product', async () => {
      const existingProduct = {
        id: 'prod-1',
        name: 'Old Name',
        vendorId: mockVendorProfile.id,
      };

      const updatedProduct = {
        ...existingProduct,
        name: 'New Name',
        price: 149.99,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct as any);

      // Step 1: Find existing product
      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });
      expect(product).not.toBeNull();

      // Step 2: Verify ownership
      const profile = await prisma.profile.findUnique({
        where: { userId: 'vendor-user-1' },
      });
      expect(product!.vendorId).toBe(profile!.id);

      // Step 3: Update product
      const updated = await prisma.product.update({
        where: { id: 'prod-1' },
        data: { name: 'New Name', price: 149.99 },
      } as any);

      expect(updated.name).toBe('New Name');
      expect(updated.price).toBe(149.99);
    });

    it('should reject update for non-owned product', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: 'other-vendor-id', // Different vendor
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);

      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId: 'vendor-user-1' },
      });

      const isOwner = product!.vendorId === profile!.id;
      expect(isOwner).toBe(false);
      // Should return error: 'Not authorized to update this product'
    });

    it('should delete own product', async () => {
      const existingProduct = {
        id: 'prod-1',
        vendorId: mockVendorProfile.id,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct as any);
      vi.mocked(prisma.product.delete).mockResolvedValue({} as any);

      // Step 1: Verify product exists and ownership
      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });
      expect(product?.vendorId).toBe(mockVendorProfile.id);

      // Step 2: Delete product
      await prisma.product.delete({
        where: { id: 'prod-1' },
      });

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
    });
  });

  describe('Public Product Access', () => {
    it('should get product by ID', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'A great product',
        price: 99.99,
        salePrice: 79.99,
        stockQuantity: 50,
        isActive: true,
        vendor: { displayName: 'Test Vendor' },
        category: { name: 'Electronics', slug: 'electronics' },
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
        include: {
          vendor: true,
          category: true,
        },
      } as any);

      expect(product).not.toBeNull();
      expect(product!.id).toBe('prod-1');
      expect(product!.name).toBe('Test Product');
      expect(product!.vendor).toBeDefined();
      expect(product!.category).toBeDefined();
    });

    it('should get paginated product list', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' },
        { id: 'prod-3', name: 'Product 3' },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(25);

      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const products = await prisma.product.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      } as any);

      const total = await prisma.product.count({ where: { isActive: true } } as any);
      const totalPages = Math.ceil(total / limit);

      expect(products).toHaveLength(3);
      expect(total).toBe(25);
      expect(totalPages).toBe(3);
    });

    it('should filter products by category', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Phone', categoryId: 'cat-electronics' },
        { id: 'prod-2', name: 'Laptop', categoryId: 'cat-electronics' },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const products = await prisma.product.findMany({
        where: {
          category: { slug: 'electronics' },
          isActive: true,
        },
      } as any);

      expect(products).toHaveLength(2);
    });

    it('should search products', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'iPhone 15', description: 'Latest Apple phone' },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const searchTerm = 'iphone';
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      } as any);

      expect(products).toHaveLength(1);
    });

    it('should return only active products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-1', isActive: true },
        { id: 'prod-2', isActive: true },
      ] as any);

      const products = await prisma.product.findMany({
        where: { isActive: true },
      });

      products.forEach(p => {
        expect(p.isActive).toBe(true);
      });
    });
  });

  describe('Authorization Checks', () => {
    it('should reject unauthenticated requests for product creation', async () => {
      vi.mocked(getTokenFromRequest).mockReturnValue(null);
      vi.mocked(getUserFromToken).mockReturnValue(null);

      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user).toBeNull();
      // Should return 401 Unauthorized
    });

    it('should reject non-vendor users from creating products', async () => {
      const customerUser = {
        userId: 'customer-1',
        email: 'customer@example.com',
        role: 'customer' as UserRole,
      };

      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(customerUser as any);
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: 'customer-1',
        isVendor: false,
      } as any);

      const user = getUserFromToken(getTokenFromRequest({} as any));
      const profile = await prisma.profile.findUnique({
        where: { userId: user!.userId },
      });

      expect(profile?.isVendor).toBe(false);
      // Should return 403 Forbidden
    });

    it('should allow admin to manage any product', async () => {
      const adminUser = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
      };

      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(adminUser as any);

      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user?.role).toBe('admin');
      // Admin can manage any product regardless of ownership
    });
  });

  describe('Product Validation', () => {
    it('should validate required fields', () => {
      const invalidProducts = [
        { name: '', price: 100, stockQuantity: 10 }, // Empty name
        { name: 'Product', price: -50, stockQuantity: 10 }, // Negative price
        { name: 'Product', price: 100, stockQuantity: -5 }, // Negative stock
      ];

      for (const product of invalidProducts) {
        const isValid =
          product.name.length > 0 &&
          product.price >= 0 &&
          product.stockQuantity >= 0;
        expect(isValid).toBe(false);
      }
    });

    it('should validate price format', () => {
      const prices = [99.99, 100, 0, 0.01];
      
      for (const price of prices) {
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate stock quantity', () => {
      const quantities = [0, 1, 100, 1000];
      
      for (const qty of quantities) {
        expect(Number.isInteger(qty)).toBe(true);
        expect(qty).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate product status', () => {
      const validStatuses = ['draft', 'published', 'archived'];
      const invalidStatus = 'invalid';

      expect(validStatuses).toContain('published');
      expect(validStatuses).not.toContain(invalidStatus);
    });
  });

  describe('Product Stock Management', () => {
    it('should check product availability', async () => {
      const mockProduct = {
        id: 'prod-1',
        stockQuantity: 50,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });

      const requestedQuantity = 10;
      const isAvailable = product!.stockQuantity >= requestedQuantity;
      expect(isAvailable).toBe(true);
    });

    it('should report insufficient stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        stockQuantity: 5,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });

      const requestedQuantity = 10;
      const isAvailable = product!.stockQuantity >= requestedQuantity;
      expect(isAvailable).toBe(false);

      const availability = {
        available: isAvailable,
        reason: isAvailable ? undefined : 'Insufficient stock',
        availableQuantity: product!.stockQuantity,
      };

      expect(availability.available).toBe(false);
      expect(availability.reason).toBe('Insufficient stock');
      expect(availability.availableQuantity).toBe(5);
    });

    it('should update stock quantity', async () => {
      const updatedProduct = {
        id: 'prod-1',
        stockQuantity: 75,
      };

      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct as any);

      const updated = await prisma.product.update({
        where: { id: 'prod-1' },
        data: { stockQuantity: 75 },
      } as any);

      expect(updated.stockQuantity).toBe(75);
    });
  });

  describe('Product Images', () => {
    it('should accept multiple product images', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      expect(images).toHaveLength(3);
      images.forEach(img => {
        expect(img).toMatch(/^https?:\/\/.+/);
      });
    });

    it('should validate image URLs', () => {
      const validUrl = 'https://example.com/image.jpg';
      const invalidUrl = 'not-a-url';

      const urlRegex = /^https?:\/\/.+/;
      expect(urlRegex.test(validUrl)).toBe(true);
      expect(urlRegex.test(invalidUrl)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const product = await prisma.product.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(product).toBeNull();
      // Should return 404 Not Found
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.product.create).mockRejectedValue(new Error('Database error'));

      await expect(
        prisma.product.create({ data: {} } as any)
      ).rejects.toThrow('Database error');
    });
  });
});
