/**
 * Unit Tests: Order Service
 * 
 * Tests for order creation, retrieval, status updates,
 * and order management business logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/prisma', () => {
  return {
    default: {
      order: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  createOrderConfirmationEmail: vi.fn(() => ({})),
}));

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import {
  getUserOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
} from '@/services/OrderService';

describe('Order Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'MIN-123',
          userId: 'user-1',
          status: 'paid',
          orderItems: [],
        },
        {
          id: 'order-2',
          orderNumber: 'MIN-456',
          userId: 'user-1',
          status: 'pending',
          orderItems: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const result = await getUserOrders('user-1');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          orderItems: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              price: true,
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array for user with no orders', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      const result = await getUserOrders('user-no-orders');

      expect(result).toEqual([]);
    });
  });

  describe('createOrder', () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Product 1', price: 100, sku: 'SKU-1', vendorId: 'vendor-1' },
      { id: 'prod-2', name: 'Product 2', price: 50, sku: 'SKU-2', vendorId: 'vendor-2' },
    ];

    it('should create order with COD payment method', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        status: 'pending',
        orderItems: [],
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'test@example.com' } as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [
          { id: 'prod-1', quantity: 2 },
          { id: 'prod-2', quantity: 1 },
        ],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
    });

    it('should require TeleBirr phone and reference', async () => {
      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 1 }],
        paymentMethod: 'TeleBirr',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('TeleBirr phone and reference required');
    });

    it('should create order with TeleBirr payment', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        status: 'pending',
        orderItems: [],
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'test@example.com' } as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 1 }],
        paymentMethod: 'TeleBirr',
        paymentMeta: {
          phone: '0911123456',
          reference: 'REF-123',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should return error for missing products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [
          { id: 'prod-1', quantity: 1 },
          { id: 'nonexistent', quantity: 1 },
        ],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some products were not found');
    });

    it('should return error for insufficient stock', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 5 } as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 10 }],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock');
      expect(result.details).toBeDefined();
    });

    it('should calculate order totals correctly', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        totalAmount: '250.00',
        subtotal: '250.00',
        orderItems: [
          { productId: 'prod-1', quantity: 2, price: 100, total: 200 },
          { productId: 'prod-2', quantity: 1, price: 50, total: 50 },
        ],
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'test@example.com' } as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [
          { id: 'prod-1', quantity: 2 },
          { id: 'prod-2', quantity: 1 },
        ],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(true);
      expect(result.order.totalAmount).toBe('250.00');
    });

    it('should handle shipping address', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Addis Ababa',
        },
        orderItems: [],
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'test@example.com' } as any);

      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 1 }],
        paymentMethod: 'COD',
        shippingAddress: {
          name: 'John Doe',
          line1: '123 Main St',
          city: 'Addis Ababa',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle transaction errors', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 1 }],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred');
    });

    it('should handle concurrent stock error', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error('Insufficient stock for product prod-1')
      );

      const result = await createOrder({
        userId: 'user-1',
        items: [{ id: 'prod-1', quantity: 1 }],
        paymentMethod: 'COD',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });

  describe('getOrderById', () => {
    it('should return order by ID', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        userId: 'user-1',
        orderItems: [],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getOrderById('order-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: { orderItems: true },
      });
      expect(result?.id).toBe('order-1');
    });

    it('should filter by user ID when provided', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await getOrderById('order-1', 'user-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1', userId: 'user-1' },
        include: { orderItems: true },
      });
    });

    it('should return null for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await getOrderById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: 'paid',
      };

      vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

      const result = await updateOrderStatus('order-1', 'paid');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'paid' },
      });
      expect(result.status).toBe('paid');
    });

    it('should filter by user ID when provided', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: 'cancelled',
      };

      vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

      await updateOrderStatus('order-1', 'cancelled', 'user-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1', userId: 'user-1' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw error for invalid status', async () => {
      await expect(
        updateOrderStatus('order-1', 'invalid_status')
      ).rejects.toThrow('Invalid order status: invalid_status');
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = [
        'pending',
        'paid',
        'confirmed',
        'processing',
        'fulfilled',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ];

      for (const status of validStatuses) {
        vi.mocked(prisma.order.update).mockResolvedValue({ id: 'order-1', status } as any);

        const result = await updateOrderStatus('order-1', status);

        expect(result.status).toBe(status);
      }
    });
  });
});
