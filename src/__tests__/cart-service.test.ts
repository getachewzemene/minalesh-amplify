/**
 * Unit Tests: Cart Service
 * 
 * Tests for cart operations including adding items, updating quantities,
 * calculating totals, and cart management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the prisma client
vi.mock('@/lib/prisma', () => {
  return {
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
  };
});

import prisma from '@/lib/prisma';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} from '@/services/CartService';

describe('Cart Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return empty cart summary when no userId or sessionId', async () => {
      const cart = await getCart();

      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
      expect(cart.itemCount).toBe(0);
    });

    it('should fetch cart items for authenticated user', async () => {
      const mockCartItems = [
        {
          id: 'cart-1',
          userId: 'user-1',
          sessionId: null,
          productId: 'prod-1',
          variantId: null,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'prod-1',
            name: 'Test Product',
            slug: 'test-product',
            price: 100,
            salePrice: 80,
            images: [],
            stockQuantity: 50,
          },
          variant: null,
        },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(mockCartItems);

      const cart = await getCart('user-1', undefined);

      expect(prisma.cart.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.subtotal).toBe(160); // 80 (sale price) * 2
      expect(cart.itemCount).toBe(2);
    });

    it('should fetch cart items for anonymous session', async () => {
      const mockCartItems = [
        {
          id: 'cart-1',
          userId: null,
          sessionId: 'session-1',
          productId: 'prod-1',
          variantId: null,
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'prod-1',
            name: 'Test Product',
            slug: 'test-product',
            price: 50,
            salePrice: null,
            images: [],
            stockQuantity: 10,
          },
          variant: null,
        },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(mockCartItems);

      const cart = await getCart(undefined, 'session-1');

      expect(prisma.cart.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.subtotal).toBe(50);
      expect(cart.itemCount).toBe(1);
    });

    it('should calculate total for multiple items', async () => {
      const mockCartItems = [
        {
          id: 'cart-1',
          userId: 'user-1',
          sessionId: null,
          productId: 'prod-1',
          variantId: null,
          quantity: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'prod-1',
            name: 'Product 1',
            slug: 'product-1',
            price: 100,
            salePrice: 80,
            images: [],
            stockQuantity: 50,
          },
          variant: null,
        },
        {
          id: 'cart-2',
          userId: 'user-1',
          sessionId: null,
          productId: 'prod-2',
          variantId: null,
          quantity: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'prod-2',
            name: 'Product 2',
            slug: 'product-2',
            price: 50,
            salePrice: null,
            images: [],
            stockQuantity: 100,
          },
          variant: null,
        },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(mockCartItems);

      const cart = await getCart('user-1');

      expect(cart.items).toHaveLength(2);
      expect(cart.subtotal).toBe(310); // (80*2) + (50*3)
      expect(cart.itemCount).toBe(5);
    });

    it('should use variant price when available', async () => {
      const mockCartItems = [
        {
          id: 'cart-1',
          userId: 'user-1',
          sessionId: null,
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'prod-1',
            name: 'Product 1',
            slug: 'product-1',
            price: 100,
            salePrice: null,
            images: [],
            stockQuantity: 50,
          },
          variant: {
            id: 'var-1',
            name: 'Size L',
            price: 120,
            salePrice: 100,
            stockQuantity: 20,
          },
        },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(mockCartItems);

      const cart = await getCart('user-1');

      expect(cart.subtotal).toBe(100); // Uses variant sale price
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart for authenticated user', async () => {
      const mockProduct = { stockQuantity: 50 };
      const mockCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        product: { name: 'Test', price: 100, salePrice: null, images: [] },
        variant: null,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCartItem as any);

      const result = await addToCart({
        userId: 'user-1',
        productId: 'prod-1',
        quantity: 2,
      });

      expect(prisma.cart.create).toHaveBeenCalled();
      expect(result.quantity).toBe(2);
    });

    it('should throw error when product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        addToCart({
          userId: 'user-1',
          productId: 'nonexistent',
          quantity: 1,
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error for insufficient stock', async () => {
      const mockProduct = { stockQuantity: 5 };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      await expect(
        addToCart({
          userId: 'user-1',
          productId: 'prod-1',
          quantity: 10,
        })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should update quantity when item already exists in cart', async () => {
      const mockProduct = { stockQuantity: 50 };
      const existingCartItem = {
        id: 'cart-1',
        userId: 'user-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
      };
      const updatedCartItem = {
        ...existingCartItem,
        quantity: 5,
        product: { name: 'Test', price: 100, salePrice: null, images: [] },
        variant: null,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(existingCartItem as any);
      vi.mocked(prisma.cart.update).mockResolvedValue(updatedCartItem as any);

      const result = await addToCart({
        userId: 'user-1',
        productId: 'prod-1',
        quantity: 3,
      });

      expect(prisma.cart.update).toHaveBeenCalled();
      expect(result.quantity).toBe(5);
    });

    it('should add item for anonymous session', async () => {
      const mockProduct = { stockQuantity: 50 };
      const mockCartItem = {
        id: 'cart-1',
        userId: null,
        sessionId: 'session-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 1,
        product: { name: 'Test', price: 100, salePrice: null, images: [] },
        variant: null,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCartItem as any);

      const result = await addToCart({
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 1,
      });

      expect(result.sessionId).toBe('session-1');
      expect(result.userId).toBeNull();
    });

    it('should check variant stock when variantId is provided', async () => {
      const mockProduct = { stockQuantity: 100 };
      const mockVariant = { stockQuantity: 5 };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant as any);

      await expect(
        addToCart({
          userId: 'user-1',
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 10,
        })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw error when variant not found', async () => {
      const mockProduct = { stockQuantity: 100 };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null);

      await expect(
        addToCart({
          userId: 'user-1',
          productId: 'prod-1',
          variantId: 'nonexistent',
          quantity: 1,
        })
      ).rejects.toThrow('Variant not found');
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update cart item quantity for user', async () => {
      const updatedItem = {
        id: 'cart-1',
        userId: 'user-1',
        quantity: 5,
        product: { name: 'Test', price: 100, salePrice: null, images: [] },
        variant: null,
      };

      vi.mocked(prisma.cart.update).mockResolvedValue(updatedItem as any);

      const result = await updateCartItemQuantity('cart-1', 5, 'user-1');

      expect(prisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1', userId: 'user-1' },
        data: { quantity: 5 },
        include: expect.any(Object),
      });
      expect(result.quantity).toBe(5);
    });

    it('should update cart item quantity for session', async () => {
      const updatedItem = {
        id: 'cart-1',
        sessionId: 'session-1',
        quantity: 3,
        product: { name: 'Test', price: 100, salePrice: null, images: [] },
        variant: null,
      };

      vi.mocked(prisma.cart.update).mockResolvedValue(updatedItem as any);

      const result = await updateCartItemQuantity('cart-1', 3, undefined, 'session-1');

      expect(prisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1', sessionId: 'session-1' },
        data: { quantity: 3 },
        include: expect.any(Object),
      });
      expect(result.quantity).toBe(3);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart for user', async () => {
      vi.mocked(prisma.cart.delete).mockResolvedValue({} as any);

      await removeFromCart('cart-1', 'user-1');

      expect(prisma.cart.delete).toHaveBeenCalledWith({
        where: { id: 'cart-1', userId: 'user-1' },
      });
    });

    it('should remove item from cart for session', async () => {
      vi.mocked(prisma.cart.delete).mockResolvedValue({} as any);

      await removeFromCart('cart-1', undefined, 'session-1');

      expect(prisma.cart.delete).toHaveBeenCalledWith({
        where: { id: 'cart-1', sessionId: 'session-1' },
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items for user', async () => {
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 3 });

      const result = await clearCart('user-1');

      expect(prisma.cart.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result.count).toBe(3);
    });

    it('should clear all cart items for session', async () => {
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 2 });

      const result = await clearCart(undefined, 'session-1');

      expect(prisma.cart.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
      });
      expect(result.count).toBe(2);
    });

    it('should return count 0 when no userId or sessionId', async () => {
      const result = await clearCart();

      expect(prisma.cart.deleteMany).not.toHaveBeenCalled();
      expect(result.count).toBe(0);
    });
  });

  describe('mergeCart', () => {
    it('should merge anonymous cart into user cart', async () => {
      const sessionCartItems = [
        { id: 'cart-session-1', productId: 'prod-1', variantId: null, quantity: 2 },
        { id: 'cart-session-2', productId: 'prod-2', variantId: null, quantity: 1 },
      ];

      vi.mocked(prisma.cart.findMany).mockResolvedValue(sessionCartItems as any);
      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce(null) // First product not in user cart
        .mockResolvedValueOnce({ id: 'cart-user-1', quantity: 3 } as any); // Second product exists
      vi.mocked(prisma.cart.update).mockResolvedValue({} as any);
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 0 });

      await mergeCart('user-1', 'session-1');

      expect(prisma.cart.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
      });
      expect(prisma.cart.update).toHaveBeenCalledTimes(2);
      expect(prisma.cart.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
      });
    });

    it('should handle empty session cart', async () => {
      vi.mocked(prisma.cart.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cart.deleteMany).mockResolvedValue({ count: 0 });

      await mergeCart('user-1', 'session-1');

      expect(prisma.cart.update).not.toHaveBeenCalled();
      expect(prisma.cart.deleteMany).toHaveBeenCalled();
    });
  });
});
