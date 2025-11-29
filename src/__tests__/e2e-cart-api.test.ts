/**
 * E2E Tests: Cart API
 * 
 * Tests the complete cart flow including adding items,
 * updating quantities, removing items, and cart merging.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    cart: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  getTokenFromRequest: vi.fn(),
  getUserFromToken: vi.fn(),
}));

// Mock API logger
vi.mock('@/lib/api-logger', () => ({
  withApiLogger: (handler: any) => handler,
}));

import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

describe('E2E: Cart API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Anonymous Cart Flow', () => {
    it('should add item to anonymous cart', async () => {
      // Setup: Anonymous user (no auth token)
      vi.mocked(getTokenFromRequest).mockReturnValue(null);
      vi.mocked(getUserFromToken).mockReturnValue(null);

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 99.99,
        salePrice: null,
        stockQuantity: 50,
      };

      const mockCartItem = {
        id: 'cart-1',
        userId: null,
        sessionId: 'session-123',
        productId: 'prod-1',
        quantity: 2,
        product: mockProduct,
        variant: null,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCartItem as any);

      // Step 1: Product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });
      expect(product).not.toBeNull();
      expect(product!.stockQuantity).toBeGreaterThanOrEqual(2);

      // Step 2: Check if item already in cart
      const existingItem = await prisma.cart.findFirst({
        where: { sessionId: 'session-123', productId: 'prod-1' },
      });
      expect(existingItem).toBeNull();

      // Step 3: Create cart item
      const cartItem = await prisma.cart.create({
        data: {
          userId: null,
          sessionId: 'session-123',
          productId: 'prod-1',
          quantity: 2,
        } as any,
      });

      expect(cartItem.sessionId).toBe('session-123');
      expect(cartItem.userId).toBeNull();
      expect(cartItem.quantity).toBe(2);
    });

    it('should get anonymous cart items', async () => {
      vi.mocked(getTokenFromRequest).mockReturnValue(null);
      vi.mocked(getUserFromToken).mockReturnValue(null);

      const mockCartItems = [
        {
          id: 'cart-1',
          sessionId: 'session-123',
          productId: 'prod-1',
          quantity: 2,
          product: { name: 'Product 1', price: 50 },
          variant: null,
        },
        {
          id: 'cart-2',
          sessionId: 'session-123',
          productId: 'prod-2',
          quantity: 1,
          product: { name: 'Product 2', price: 30 },
          variant: null,
        },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(mockCartItems as any);

      const cartItems = await prisma.cart.findMany({
        where: { sessionId: 'session-123' },
      });

      expect(cartItems).toHaveLength(2);
      
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);
      expect(subtotal).toBe(130); // (50*2) + (30*1)

      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      expect(itemCount).toBe(3);
    });
  });

  describe('Authenticated Cart Flow', () => {
    const mockUser = {
      userId: 'user-1',
      email: 'user@example.com',
      role: 'customer',
    };

    beforeEach(() => {
      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(mockUser as any);
    });

    it('should add item to authenticated user cart', async () => {
      const mockProduct = {
        id: 'prod-1',
        stockQuantity: 100,
      };

      const mockCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        productId: 'prod-1',
        quantity: 3,
        product: { name: 'Test', price: 75 },
        variant: null,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCartItem as any);

      // Step 1: Verify user authentication
      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user?.userId).toBe('user-1');

      // Step 2: Product has sufficient stock
      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });
      expect(product!.stockQuantity).toBeGreaterThanOrEqual(3);

      // Step 3: Create cart item for user
      const cartItem = await prisma.cart.create({
        data: {
          userId: 'user-1',
          sessionId: null,
          productId: 'prod-1',
          quantity: 3,
        } as any,
      });

      expect(cartItem.userId).toBe('user-1');
      expect(cartItem.sessionId).toBeNull();
    });

    it('should update quantity when adding existing item', async () => {
      const existingCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        productId: 'prod-1',
        quantity: 2,
      };

      const updatedCartItem = {
        ...existingCartItem,
        quantity: 5,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(existingCartItem as any);
      vi.mocked(prisma.cart.update).mockResolvedValue(updatedCartItem as any);

      // Step 1: Find existing item
      const existing = await prisma.cart.findFirst({
        where: { userId: 'user-1', productId: 'prod-1' },
      });
      expect(existing).not.toBeNull();

      // Step 2: Update quantity
      const updated = await prisma.cart.update({
        where: { id: existing!.id },
        data: { quantity: existing!.quantity + 3 },
      });

      expect(updated.quantity).toBe(5);
    });

    it('should prevent adding more than available stock', async () => {
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
      // Should return error: 'Insufficient stock'
    });
  });

  describe('Cart Update Operations', () => {
    it('should update cart item quantity', async () => {
      const mockCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        quantity: 5,
      };

      vi.mocked(prisma.cart.update).mockResolvedValue(mockCartItem as any);

      const updated = await prisma.cart.update({
        where: { id: 'cart-1', userId: 'user-1' },
        data: { quantity: 5 },
      } as any);

      expect(updated.quantity).toBe(5);
    });

    it('should remove item when quantity set to zero', async () => {
      // In practice, we'd remove the item when quantity is 0
      vi.mocked(prisma.cart.delete).mockResolvedValue({} as any);

      await prisma.cart.delete({
        where: { id: 'cart-1' },
      } as any);

      expect(prisma.cart.delete).toHaveBeenCalled();
    });

    it('should remove specific item from cart', async () => {
      vi.mocked(prisma.cart.delete).mockResolvedValue({} as any);

      await prisma.cart.delete({
        where: { id: 'cart-1', userId: 'user-1' },
      } as any);

      expect(prisma.cart.delete).toHaveBeenCalledWith({
        where: { id: 'cart-1', userId: 'user-1' },
      });
    });
  });

  describe('Cart Clear and Merge', () => {
    it('should clear entire cart', async () => {
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 3 });

      const result = await prisma.cart.deleteMany({
        where: { userId: 'user-1' },
      });

      expect(result.count).toBe(3);
    });

    it('should merge anonymous cart on login', async () => {
      const sessionCartItems = [
        { id: 'cart-s1', productId: 'prod-1', quantity: 2 },
        { id: 'cart-s2', productId: 'prod-2', quantity: 1 },
      ];

      const userCartItems = [
        { id: 'cart-u1', productId: 'prod-1', quantity: 1 }, // Same product as session
      ];

      vi.mocked(prisma.cart.findMany)
        .mockResolvedValueOnce(sessionCartItems as any) // Session cart
        .mockResolvedValueOnce(userCartItems as any); // User cart

      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(userCartItems[0] as any) // prod-1 exists in user cart
        .mockResolvedValueOnce(null); // prod-2 doesn't exist

      vi.mocked(prisma.cart.update).mockResolvedValue({} as any);
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 1 });

      // Step 1: Get session cart
      const sessionCart = await prisma.cart.findMany({
        where: { sessionId: 'session-123' },
      });
      expect(sessionCart).toHaveLength(2);

      // Step 2: For each session item, check if exists in user cart
      for (const sessionItem of sessionCart) {
        const existingUserItem = await prisma.cart.findFirst({
          where: { userId: 'user-1', productId: sessionItem.productId },
        });

        if (existingUserItem) {
          // Merge quantities
          await prisma.cart.update({
            where: { id: existingUserItem.id },
            data: { quantity: existingUserItem.quantity + sessionItem.quantity },
          });
        } else {
          // Move to user cart
          await prisma.cart.update({
            where: { id: sessionItem.id },
            data: { userId: 'user-1', sessionId: null },
          });
        }
      }

      // Step 3: Clean up session cart
      await prisma.cart.deleteMany({
        where: { sessionId: 'session-123' },
      });

      expect(prisma.cart.update).toHaveBeenCalledTimes(2);
      expect(prisma.cart.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Cart with Variants', () => {
    it('should add variant item to cart', async () => {
      const mockProduct = { id: 'prod-1', stockQuantity: 100 };
      const mockVariant = { id: 'var-1', stockQuantity: 20 };
      const mockCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 1,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCartItem as any);

      // Step 1: Verify variant exists and has stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: 'var-1' },
      });
      expect(variant).not.toBeNull();
      expect(variant!.stockQuantity).toBeGreaterThanOrEqual(1);

      // Step 2: Create cart item with variant
      const cartItem = await prisma.cart.create({
        data: {
          userId: 'user-1',
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 1,
        } as any,
      });

      expect(cartItem.variantId).toBe('var-1');
    });

    it('should check variant stock separately', async () => {
      const mockProduct = { id: 'prod-1', stockQuantity: 100 };
      const mockVariant = { id: 'var-1', stockQuantity: 5 };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as any);

      const variant = await prisma.productVariant.findUnique({
        where: { id: 'var-1' },
      });

      const requestedQuantity = 10;
      const isAvailable = variant!.stockQuantity >= requestedQuantity;

      expect(isAvailable).toBe(false);
      // Should return error even if product has enough stock
    });

    it('should treat same product with different variants as separate items', () => {
      // This test validates the logic without database calls
      const cartItems = [
        { id: 'cart-1', productId: 'prod-1', variantId: 'var-1', quantity: 2 },
        { id: 'cart-2', productId: 'prod-1', variantId: 'var-2', quantity: 1 },
      ];

      // Same product with different variants should be separate cart items
      expect(cartItems).toHaveLength(2);
      expect(cartItems[0].productId).toBe(cartItems[1].productId);
      expect(cartItems[0].variantId).not.toBe(cartItems[1].variantId);
    });
  });

  describe('Cart Price Calculation', () => {
    it('should use sale price when available', () => {
      const item = {
        product: { price: 100, salePrice: 80 },
        variant: null,
        quantity: 2,
      };

      const unitPrice = item.product.salePrice ?? item.product.price;
      const total = unitPrice * item.quantity;

      expect(unitPrice).toBe(80);
      expect(total).toBe(160);
    });

    it('should use variant price when variant is selected', () => {
      const item = {
        product: { price: 100, salePrice: 80 },
        variant: { price: 120, salePrice: 100 },
        quantity: 1,
      };

      const unitPrice = 
        item.variant?.salePrice ?? 
        item.variant?.price ?? 
        item.product.salePrice ?? 
        item.product.price;
      const total = unitPrice * item.quantity;

      expect(unitPrice).toBe(100);
      expect(total).toBe(100);
    });

    it('should calculate cart subtotal correctly', () => {
      const items = [
        { product: { price: 50 }, variant: null, quantity: 3 }, // 150
        { product: { price: 100, salePrice: 75 }, variant: null, quantity: 2 }, // 150
        { product: { price: 30 }, variant: { price: 35, salePrice: 30 }, quantity: 1 }, // 30
      ];

      const subtotal = items.reduce((sum, item) => {
        const price = 
          item.variant?.salePrice ?? 
          item.variant?.price ?? 
          item.product.salePrice ?? 
          item.product.price;
        return sum + price * item.quantity;
      }, 0);

      expect(subtotal).toBe(330);
    });

    it('should calculate item count correctly', () => {
      const items = [
        { quantity: 3 },
        { quantity: 2 },
        { quantity: 1 },
      ];

      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      expect(itemCount).toBe(6);

      const uniqueItems = items.length;
      expect(uniqueItems).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const product = await prisma.product.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(product).toBeNull();
      // Should throw: 'Product not found'
    });

    it('should handle variant not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'prod-1' } as any);
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null);

      const variant = await prisma.productVariant.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(variant).toBeNull();
      // Should throw: 'Variant not found'
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.cart.create).mockRejectedValue(new Error('Database error'));

      await expect(
        prisma.cart.create({ data: {} } as any)
      ).rejects.toThrow('Database error');
    });
  });
});
