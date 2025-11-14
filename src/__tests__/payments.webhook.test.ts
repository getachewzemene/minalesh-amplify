import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

function createMockPrisma() {
  return {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryReservation: {
      findMany: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  };
}

vi.mock('@/lib/prisma', () => ({ default: createMockPrisma() }));

// Mock inventory functions
vi.mock('@/lib/inventory', () => ({
  commitReservation: vi.fn().mockResolvedValue(true),
  releaseReservation: vi.fn().mockResolvedValue(true),
}));

// Import after mocks
import { POST as webhookPost } from '../../app/api/payments/webhook/route';
import prisma from '@/lib/prisma';
type MockedPrisma = {
  order: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  inventoryReservation: {
    findMany: ReturnType<typeof vi.fn>;
  };
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
};

describe('Payments Webhook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PAYMENT_WEBHOOK_SECRET = 'test-secret';
    process.env.TELEBIRR_WEBHOOK_SECRET = 'test-secret';
  });

  it('rejects unauthorized requests (bad signature)', async () => {
    const body = { provider: 'TeleBirr', status: 'completed', paymentReference: 'REF-1' };
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-webhook-signature': 'bad' },
      body: JSON.stringify(body),
    });
    const res = await webhookPost(req);
    expect(res.status).toBe(401);
  });

  it('marks order as paid on completed status with valid signature', async () => {
    const order = { id: 'o1', orderNumber: 'MIN-1', paymentStatus: 'pending', notes: null };
    const mp = prisma as unknown as MockedPrisma;
    mp.order.findFirst.mockResolvedValue(order);
    mp.order.findUnique.mockResolvedValue({ ...order, paymentStatus: 'pending' });
    
    // Mock inventory reservations - return empty array (no active reservations)
    mp.inventoryReservation.findMany.mockResolvedValue([]);
    
    // Simulate raw queries for webhook events + order update
    mp.$queryRawUnsafe.mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT id, status FROM "webhook_events"')) return Promise.resolve([]);
      if (sql.startsWith('UPDATE "orders"')) return Promise.resolve([{ id: order.id }]);
      return Promise.resolve([]);
    });
    mp.$executeRawUnsafe.mockImplementation((sql: string) => {
      if (sql.startsWith('INSERT INTO "webhook_events"')) return Promise.resolve(1);
      if (sql.startsWith('INSERT INTO "order_events"')) return Promise.resolve(1);
      if (sql.startsWith('UPDATE "webhook_events"')) return Promise.resolve(1);
      if (sql.startsWith('UPDATE "orders"')) return Promise.resolve(1);
      return Promise.resolve(1);
    });
    // After update fetch returns completed
    mp.order.findUnique.mockResolvedValue({ ...order, paymentStatus: 'completed', status: 'paid', paidAt: new Date() });

    const payload = { provider: 'TeleBirr', status: 'completed', paymentReference: 'REF-1' };
    const raw = JSON.stringify(payload);
  const sig = createHmac('sha256', process.env.TELEBIRR_WEBHOOK_SECRET!).update(raw).digest('hex');

    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
  headers: { 'content-type': 'application/json', 'x-telebirr-signature': sig },
      body: raw,
    });

    const res = await webhookPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mp.$queryRawUnsafe).toHaveBeenCalled();
    expect(mp.$executeRawUnsafe).toHaveBeenCalled();
  });
});
