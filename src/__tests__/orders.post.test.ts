import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getTokenFromRequest: () => 'token',
  getUserFromToken: () => ({ userId: 'user-1', email: 'user@example.com' }),
}));

function createMockPrisma() {
  return {
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  order: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
  };
}

vi.mock('@/lib/prisma', () => ({ default: createMockPrisma() }));

import { POST as ordersPost } from '../../app/api/orders/route';
import prisma from '@/lib/prisma';
type MockedPrisma = {
  product: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  order: { create: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

describe('Orders POST', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates order on happy path and decrements stock', async () => {
    // Outside transaction lookups
    const mp = prisma as unknown as MockedPrisma;
    mp.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'P1', price: 100, sku: 'SKU1', vendorId: 'v1' },
    ]);
    mp.product.findUnique.mockResolvedValue({ stockQuantity: 10 });

    // Transaction behavior
    type Tx = { product: { updateMany: (args: unknown) => Promise<{ count: number }> }, order: { create: (args: unknown) => Promise<unknown> } };
    mp.$transaction.mockImplementation(async (cb: (tx: Tx) => Promise<unknown>) => {
      const tx: Tx = {
        product: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          create: vi.fn().mockResolvedValue({ id: 'o1', orderNumber: 'MIN-1', orderItems: [] }),
        },
      };
      return cb(tx);
    });

    const payload = { items: [{ id: 'p1', quantity: 2 }], paymentMethod: 'COD' };
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await ordersPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 409 on concurrent insufficient stock', async () => {
    // Outside transaction
    const mp = prisma as unknown as MockedPrisma;
    mp.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'P1', price: 100, sku: 'SKU1', vendorId: 'v1' },
    ]);
    mp.product.findUnique.mockResolvedValue({ stockQuantity: 10 });

    // Transaction behavior: updateMany fails due to race
    type Tx = { product: { updateMany: (args: unknown) => Promise<{ count: number }> }, order: { create: (args: unknown) => Promise<unknown> } };
    mp.$transaction.mockImplementation(async (cb: (tx: Tx) => Promise<unknown>) => {
      const tx: Tx = {
        product: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        order: {
          create: vi.fn(),
        },
      };
      return cb(tx);
    });

    const payload = { items: [{ id: 'p1', quantity: 20 }], paymentMethod: 'COD' };
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await ordersPost(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/Insufficient stock/);
  });
});
