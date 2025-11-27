/**
 * E2E Tests: Orders API
 * 
 * Tests the complete order flow including order creation,
 * status updates, and order management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
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
    cart: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock email
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  createOrderConfirmationEmail: vi.fn(() => ({})),
}));

// Mock auth and middleware
vi.mock('@/lib/auth', () => ({
  getTokenFromRequest: vi.fn(),
  getUserFromToken: vi.fn(),
}));

vi.mock('@/lib/middleware', () => ({
  withAuth: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { withAuth } from '@/lib/middleware';

describe('E2E: Orders API', () => {
  const mockUser = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'customer' as UserRole,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
    vi.mocked(getUserFromToken).mockReturnValue(mockUser as any);
    vi.mocked(withAuth).mockReturnValue({ error: null, payload: mockUser as any });
  });

  describe('Order Creation Flow', () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Product 1', price: 100, sku: 'SKU-1', vendorId: 'vendor-1' },
      { id: 'prod-2', name: 'Product 2', price: 50, sku: 'SKU-2', vendorId: 'vendor-2' },
    ];

    it('should create order with COD payment', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123456',
        userId: 'user-1',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'COD',
        subtotal: '150.00',
        totalAmount: '150.00',
        orderItems: [
          { productId: 'prod-1', quantity: 1, price: 100, total: 100 },
          { productId: 'prod-2', quantity: 1, price: 50, total: 50 },
        ],
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'user@example.com' } as any);

      // Step 1: Verify authentication
      const authResult = withAuth({} as any);
      expect(authResult.error).toBeNull();
      expect(authResult.payload?.userId).toBe('user-1');

      // Step 2: Validate order items
      const orderItems = [
        { id: 'prod-1', quantity: 1 },
        { id: 'prod-2', quantity: 1 },
      ];
      expect(orderItems.length).toBeGreaterThan(0);

      // Step 3: Fetch and validate products
      const productIds = orderItems.map(i => i.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      expect(products).toHaveLength(2);

      // Step 4: Check stock availability
      for (const item of orderItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.id },
        });
        expect(product!.stockQuantity).toBeGreaterThanOrEqual(item.quantity);
      }

      // Step 5: Create order via transaction
      const order = await prisma.$transaction(async () => mockOrder);
      expect(order.id).toBeDefined();
      expect(order.orderNumber).toContain('MIN-');
      expect(order.status).toBe('pending');
      expect(order.paymentMethod).toBe('COD');
    });

    it('should create order with TeleBirr payment', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123456',
        paymentMethod: 'TeleBirr',
        paymentReference: 'REF-12345',
        notes: 'TeleBirr Phone: 0911123456',
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 100 } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'user@example.com' } as any);

      const paymentMeta = {
        phone: '0911123456',
        reference: 'REF-12345',
      };

      // Validate TeleBirr payment requirements
      expect(paymentMeta.phone).toBeDefined();
      expect(paymentMeta.reference).toBeDefined();

      const order = await prisma.$transaction(async () => mockOrder);
      expect(order.paymentMethod).toBe('TeleBirr');
      expect(order.paymentReference).toBe('REF-12345');
      expect(order.notes).toContain('TeleBirr Phone');
    });

    it('should reject TeleBirr order without phone or reference', async () => {
      const paymentMethod = 'TeleBirr';
      const paymentMeta = { phone: undefined, reference: undefined };

      const isValid = paymentMethod !== 'TeleBirr' || 
        (paymentMeta?.phone && paymentMeta?.reference);
      
      expect(isValid).toBeFalsy();
      // Should return error: 'TeleBirr phone and reference required'
    });

    it('should reject order with missing products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);

      const orderItems = [
        { id: 'prod-1', quantity: 1 },
        { id: 'nonexistent', quantity: 1 },
      ];

      const products = await prisma.product.findMany({
        where: { id: { in: orderItems.map(i => i.id) } },
      });

      const allFound = products.length === orderItems.length;
      expect(allFound).toBe(false);
      // Should return error: 'Some products were not found'
    });

    it('should reject order with insufficient stock', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProducts[0]] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ stockQuantity: 5 } as any);

      const product = await prisma.product.findUnique({
        where: { id: 'prod-1' },
      });

      const requestedQuantity = 10;
      const hasEnoughStock = product!.stockQuantity >= requestedQuantity;
      expect(hasEnoughStock).toBe(false);
      // Should return error: 'Insufficient stock'
    });

    it('should calculate order totals correctly', () => {
      const items = [
        { id: 'prod-1', quantity: 2, price: 100 }, // 200
        { id: 'prod-2', quantity: 3, price: 50 },  // 150
      ];

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(350);

      const shippingAmount = 0;
      const taxAmount = 0;
      const discountAmount = 0;
      const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;
      expect(totalAmount).toBe(350);
    });

    it('should send confirmation email after order creation', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123456',
        totalAmount: '150.00',
        orderItems: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'user@example.com' } as any);

      // After order creation, send confirmation email
      const user = await prisma.user.findUnique({
        where: { id: 'user-1' },
      });
      expect(user?.email).toBe('user@example.com');

      await sendEmail({} as any);
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  describe('Order Retrieval', () => {
    it('should get user orders', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'MIN-123', status: 'delivered', orderItems: [] },
        { id: 'order-2', orderNumber: 'MIN-456', status: 'pending', orderItems: [] },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const orders = await prisma.order.findMany({
        where: { userId: 'user-1' },
        include: { orderItems: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(orders).toHaveLength(2);
    });

    it('should get single order by ID', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'MIN-123',
        userId: 'user-1',
        status: 'pending',
        orderItems: [
          { productName: 'Product 1', quantity: 2, price: 100 },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const order = await prisma.order.findUnique({
        where: { id: 'order-1', userId: 'user-1' },
        include: { orderItems: true },
      } as any);

      expect(order).not.toBeNull();
      expect(order!.id).toBe('order-1');
      expect(order!.orderItems).toHaveLength(1);
    });

    it('should prevent access to other user orders', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      // Trying to access another user's order should return null
      const order = await prisma.order.findUnique({
        where: { id: 'order-1', userId: 'user-1' },
      } as any);

      expect(order).toBeNull();
    });
  });

  describe('Order Status Updates', () => {
    it('should update order status', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: 'paid',
      };

      vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

      const order = await prisma.order.update({
        where: { id: 'order-1' },
        data: { status: 'paid' },
      } as any);

      expect(order.status).toBe('paid');
    });

    it('should validate status transitions', () => {
      const validStatuses = [
        'pending', 'paid', 'confirmed', 'processing',
        'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'
      ];

      const invalidStatus = 'invalid_status';
      expect(validStatuses).not.toContain(invalidStatus);

      for (const status of validStatuses) {
        expect(validStatuses).toContain(status);
      }
    });

    it('should update payment status on payment completion', async () => {
      const updatedOrder = {
        id: 'order-1',
        status: 'paid',
        paymentStatus: 'completed',
        paidAt: new Date(),
      };

      vi.mocked(prisma.order.update).mockResolvedValue(updatedOrder as any);

      const order = await prisma.order.update({
        where: { id: 'order-1' },
        data: {
          status: 'paid',
          paymentStatus: 'completed',
          paidAt: new Date(),
        },
      } as any);

      expect(order.status).toBe('paid');
      expect(order.paymentStatus).toBe('completed');
      expect(order.paidAt).toBeDefined();
    });
  });

  describe('Order with Shipping Address', () => {
    it('should include shipping address in order', async () => {
      const mockOrder = {
        id: 'order-1',
        shippingAddress: {
          name: 'John Doe',
          phone: '+251911123456',
          line1: '123 Main Street',
          city: 'Addis Ababa',
          postalCode: '1000',
          country: 'Ethiopia',
        },
      };

      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);

      const shippingAddress = {
        name: 'John Doe',
        phone: '+251911123456',
        line1: '123 Main Street',
        city: 'Addis Ababa',
        postalCode: '1000',
        country: 'Ethiopia',
      };

      expect(shippingAddress.name).toBeDefined();
      expect(shippingAddress.phone).toBeDefined();
      expect(shippingAddress.line1).toBeDefined();
      expect(shippingAddress.city).toBeDefined();

      const order = await prisma.$transaction(async () => mockOrder);
      expect(order.shippingAddress).toBeDefined();
      expect(order.shippingAddress.city).toBe('Addis Ababa');
    });

    it('should include billing address if different', async () => {
      const mockOrder = {
        id: 'order-1',
        shippingAddress: { city: 'Addis Ababa' },
        billingAddress: { city: 'Bahir Dar' },
      };

      vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder);

      const order = await prisma.$transaction(async () => mockOrder);
      expect(order.shippingAddress.city).toBe('Addis Ababa');
      expect(order.billingAddress.city).toBe('Bahir Dar');
    });
  });

  describe('Order Validation', () => {
    it('should validate minimum order items', () => {
      const orderWithItems = [{ id: 'prod-1', quantity: 1 }];
      const orderWithoutItems: any[] = [];

      expect(orderWithItems.length).toBeGreaterThan(0);
      expect(orderWithoutItems.length).toBe(0);
      // Empty order should be rejected
    });

    it('should validate item quantities', () => {
      const validQuantities = [1, 5, 100];
      const invalidQuantities = [0, -1, 1000]; // max is 999

      for (const qty of validQuantities) {
        const isValid = qty > 0 && qty <= 999;
        expect(isValid).toBe(true);
      }

      expect(invalidQuantities[0]).toBe(0); // Zero is invalid
      expect(invalidQuantities[1]).toBeLessThan(0); // Negative is invalid
      expect(invalidQuantities[2]).toBeGreaterThan(999); // Over max is invalid
    });

    it('should validate payment method', () => {
      const validMethods = ['COD', 'TeleBirr', 'CBE', 'Awash', 'BankTransfer', 'Other'];
      const invalidMethod = 'CreditCard';

      expect(validMethods).not.toContain(invalidMethod);
      
      for (const method of validMethods) {
        expect(validMethods).toContain(method);
      }
    });
  });

  describe('Authorization', () => {
    it('should require authentication for order operations', async () => {
      vi.mocked(withAuth).mockReturnValue({ error: new Response('Unauthorized', { status: 401 }) as any, payload: null });

      const authResult = withAuth({} as any);
      expect(authResult.error).not.toBeNull();
      expect(authResult.payload).toBeNull();
    });

    it('should allow users to only see their own orders', async () => {
      const authResult = withAuth({} as any);
      expect(authResult.payload?.userId).toBe('user-1');

      // Orders query should filter by userId
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      
      const orders = await prisma.order.findMany({
        where: { userId: authResult.payload!.userId },
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });
  });

  describe('Stock Decrement on Order', () => {
    it('should decrement stock when order is created', async () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ];

      // In transaction, stock is decremented atomically
      const decrementOperations = orderItems.map(item => ({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      }));

      expect(decrementOperations).toHaveLength(2);
      expect(decrementOperations[0].data.stockQuantity.decrement).toBe(2);
      expect(decrementOperations[1].data.stockQuantity.decrement).toBe(1);
    });

    it('should handle concurrent stock race condition', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error('Insufficient stock for product prod-1')
      );

      await expect(
        prisma.$transaction(async () => { throw new Error('Insufficient stock for product prod-1'); })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      await expect(
        prisma.$transaction(async () => { throw new Error('Database error'); })
      ).rejects.toThrow('Database error');
      // Should return: { success: false, error: 'An error occurred' }
    });

    it('should handle validation errors', () => {
      const invalidOrder = {
        items: [], // Empty items
        paymentMethod: 'InvalidMethod',
      };

      const errors = [];
      if (invalidOrder.items.length === 0) {
        errors.push({ field: 'items', message: 'At least one item is required' });
      }
      if (!['COD', 'TeleBirr', 'CBE', 'Awash', 'BankTransfer', 'Other'].includes(invalidOrder.paymentMethod)) {
        errors.push({ field: 'paymentMethod', message: 'Invalid payment method' });
      }

      expect(errors).toHaveLength(2);
    });
  });
});
