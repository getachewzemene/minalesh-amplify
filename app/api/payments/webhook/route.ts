import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { commitReservation } from '@/services/InventoryService';
import { createCommissionLedgerEntries } from '@/lib/vendor-payout';

const schema = z.object({
  provider: z.string().min(1),
  status: z.enum(['completed', 'failed', 'pending']),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  paymentReference: z.string().optional(),
  amount: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const t0 = Date.now();
    // Read raw body for signature verification
    const rawBody = await request.text();

    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const sigHeader = request.headers.get('x-webhook-signature') || '';
    const secretHeader = request.headers.get('x-webhook-secret') || '';

    if (!secret) {
      console.warn('PAYMENT_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    let authorized = false;
    let computedSig: string | null = null;
    if (sigHeader) {
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      computedSig = expected;
      try {
        authorized = timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sigHeader, 'utf8'));
      } catch {
        authorized = false;
      }
    } else if (secretHeader) {
      authorized = secretHeader === secret;
    }

    // Parse body early (needed for provider-specific verification)
    const body = JSON.parse(rawBody);

    // Provider specific signature fallback if generic not authorized
    if (!authorized) {
      const providerTmp = typeof body.provider === 'string' ? body.provider.toLowerCase() : '';
      const providerSigHeaders: Record<string, { header: string; env: string }> = {
        telebirr: { header: 'x-telebirr-signature', env: 'TELEBIRR_WEBHOOK_SECRET' },
        cbe: { header: 'x-cbe-signature', env: 'CBE_WEBHOOK_SECRET' },
        awash: { header: 'x-awash-signature', env: 'AWASH_WEBHOOK_SECRET' },
      };
      const cfg = providerSigHeaders[providerTmp];
      if (cfg) {
        const providerSecret = process.env[cfg.env] || secret;
        const pvSig = request.headers.get(cfg.header);
        if (pvSig) {
          const expected = createHmac('sha256', providerSecret).update(rawBody).digest('hex');
          try {
            authorized = timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(pvSig, 'utf8'));
          } catch {
            authorized = false;
          }
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 422 });

    const { provider, status, orderId, orderNumber, paymentReference } = parsed.data;

    // Optional provider-specific verification overrides (per-provider secrets/headers)
    // Fallback to the generic HMAC check above if not provided or fails.
    const providerLower = provider.toLowerCase();
    const providerVerifiers: Record<string, (raw: string, req: Request) => Promise<boolean>> = {
      telebirr: async (raw, req) => {
        const teleSecret = process.env.TELEBIRR_WEBHOOK_SECRET || secret;
        const sig = req.headers.get('x-telebirr-signature');
        if (!sig) return false;
        const expected = createHmac('sha256', teleSecret).update(raw).digest('hex');
        computedSig = expected;
        try { return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8')); } catch { return false; }
      },
      cbe: async (raw, req) => {
        const cbeSecret = process.env.CBE_WEBHOOK_SECRET || secret;
        const sig = req.headers.get('x-cbe-signature');
        if (!sig) return false;
        const expected = createHmac('sha256', cbeSecret).update(raw).digest('hex');
        computedSig = expected;
        try { return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8')); } catch { return false; }
      },
      awash: async (raw, req) => {
        const awashSecret = process.env.AWASH_WEBHOOK_SECRET || secret;
        const sig = req.headers.get('x-awash-signature');
        if (!sig) return false;
        const expected = createHmac('sha256', awashSecret).update(raw).digest('hex');
        computedSig = expected;
        try { return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8')); } catch { return false; }
      },
    };
    if (providerLower in providerVerifiers) {
      const ok = await providerVerifiers[providerLower](rawBody, request);
      if (!ok) return NextResponse.json({ error: 'Unauthorized (provider)' }, { status: 401 });
    }

    // Try to find order by reference, then number, then id
  let order: { id: string; orderNumber: string; paymentStatus: string; totalAmount?: unknown; notes?: string | null } | null = null;
    if (paymentReference) {
      order = await prisma.order.findFirst({ where: { paymentReference } });
    }
    if (!order && orderNumber) {
      order = await prisma.order.findFirst({ where: { orderNumber } });
    }
    if (!order && orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Idempotency: if already completed, return success
    if (order.paymentStatus === 'completed') {
      return NextResponse.json({ ok: true, message: 'Already completed' });
    }

  // Record webhook event for idempotency/history
    const metaObj: unknown = parsed.data.meta;
    const potentialEventId =
      typeof metaObj === 'object' && metaObj !== null && 'eventId' in metaObj && typeof (metaObj as Record<string, unknown>).eventId === 'string'
        ? (metaObj as Record<string, unknown>).eventId as string
        : (typeof (parsed.data as unknown) === 'object' && parsed.data !== null && 'eventId' in (parsed.data as Record<string, unknown>) && typeof (parsed.data as Record<string, unknown>).eventId === 'string'
            ? (parsed.data as Record<string, unknown>).eventId as string
            : undefined);
    const eventId = potentialEventId || paymentReference || null;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    let webhookEventId: string | null = null;
    try {
      if (eventId) {
        const existing: Array<{ id: string; status: string }> = await prisma.$queryRawUnsafe(
          'SELECT id, status FROM "webhook_events" WHERE provider = $1 AND event_id = $2',
          provider,
          eventId
        );
        if (existing.length > 0 && existing[0].status === 'processed') {
          return NextResponse.json({ ok: true, message: 'Already processed' });
        }
        const updated: Array<{ id: string }> = await prisma.$queryRawUnsafe(
          'UPDATE "webhook_events" SET payload=$3, signature=$4, signature_hash=$5, status=$6, ip_address=$7, archived=false WHERE provider=$1 AND event_id=$2 RETURNING id',
          provider,
          eventId,
          parsed.data,
          sigHeader || secretHeader || null,
          computedSig,
          'received',
          ip
        );
        if (updated.length === 0) {
          const inserted: Array<{ id: string }> = await prisma.$queryRawUnsafe(
            'INSERT INTO "webhook_events" (provider, event_id, payload, signature, signature_hash, status, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
            provider,
            eventId,
            parsed.data,
            sigHeader || secretHeader || null,
            computedSig,
            'received',
            ip
          );
          webhookEventId = inserted[0]?.id || null;
        } else {
          webhookEventId = updated[0].id;
        }
      } else {
        const inserted: Array<{ id: string }> = await prisma.$queryRawUnsafe(
          'INSERT INTO "webhook_events" (provider, event_id, payload, signature, signature_hash, status, ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
          provider,
          null,
          parsed.data,
          sigHeader || secretHeader || null,
          computedSig,
          'received',
          ip
        );
        webhookEventId = inserted[0]?.id || null;
      }
    } catch (e) {
      console.warn('WebhookEvent upsert (raw) failed:', e);
    }

    if (status === 'completed') {
      // Optional amount verification
      if (typeof parsed.data.amount === 'string') {
        const amt = parseFloat(parsed.data.amount);
        // Prisma Decimal compatibility: totalAmount may be a number or a Decimal-like object with toString()
        type DecimalLike = { toString(): string };
        const total = ((): number => {
          const val = (order as { totalAmount?: number | DecimalLike | null }).totalAmount;
          if (typeof val === 'number') return val;
          if (val && typeof (val as DecimalLike).toString === 'function') return Number((val as DecimalLike).toString());
          return Number(val ?? 0);
        })();
        if (!Number.isNaN(amt) && Math.abs(amt - total) > 0.005) {
          if (webhookEventId) {
            await prisma.$executeRawUnsafe(
              'UPDATE "webhook_events" SET status=$2, error_message=$3 WHERE id=$1',
              webhookEventId,
              'error',
              `Amount mismatch: got ${amt}, expected ${total}`
            );
          }
          return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }
      }

      const now = new Date();
      
      // Commit inventory reservations
      const reservations = await prisma.inventoryReservation.findMany({
        where: { orderId: order.id, status: 'active' },
      });
      
      for (const reservation of reservations) {
        const committed = await commitReservation(reservation.id, order.id);
        if (!committed) {
          console.error(`Failed to commit reservation ${reservation.id} for order ${order.id}`);
        }
      }
      
      await prisma.$executeRawUnsafe(
        'UPDATE "orders" SET payment_status=$2, status=$3, paid_at=$4, updated_at=$4 WHERE id=$1',
        order.id,
        'completed',
        'paid',
        now
      );
      await prisma.$executeRawUnsafe(
        'INSERT INTO "order_events" (order_id, event_type, status, description, metadata) VALUES ($1,$2,$3,$4,$5)',
        order.id,
        'payment',
        'paid',
        `Payment completed by ${provider}`,
        JSON.stringify({ provider, reference: paymentReference || null, orderNumber: order.orderNumber, webhookEventId })
      );
      
      // Create commission ledger entries for vendor payouts
      try {
        const entriesCreated = await createCommissionLedgerEntries(order.id);
        console.log(`Created ${entriesCreated} commission ledger entries for order ${order.id}`);
      } catch (ledgerError) {
        console.error('Error creating commission ledger entries:', ledgerError);
        // Don't fail the payment if ledger creation fails
      }
      const latency = Date.now() - t0;
      if (webhookEventId) {
        await prisma.$executeRawUnsafe(
          'UPDATE "webhook_events" SET status=$2, processed_at=$3, order_id=$4, latency_ms=$5 WHERE id=$1',
          webhookEventId,
          'processed',
          now,
          order.id,
          latency
        );
      }
      const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { orderItems: true } });
      return NextResponse.json({ ok: true, order: fresh });
    }

    // For failed states, release inventory reservations
    if (status === 'failed') {
      const reservations = await prisma.inventoryReservation.findMany({
        where: { orderId: order.id, status: 'active' },
      });
      
      for (const reservation of reservations) {
        await prisma.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'released', releasedAt: new Date() },
        }).catch(err => console.error('Error releasing reservation:', err));
      }
    }
    
    // For failed/pending states, record provider info in notes
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: `Payment ${status} from ${provider}` + (order.notes ? ` | ${order.notes}` : ''),
      },
    });
    await prisma.$executeRawUnsafe(
      'INSERT INTO "order_events" (order_id, event_type, description, metadata) VALUES ($1,$2,$3,$4)',
      order.id,
      'payment',
      `Payment ${status} by ${provider}`,
      JSON.stringify({ provider, reference: paymentReference || null, status, orderNumber: order.orderNumber, webhookEventId })
    );
    if (webhookEventId) {
      await prisma.$executeRawUnsafe(
        'UPDATE "webhook_events" SET status=$2, processed_at=$3, order_id=$4 WHERE id=$1',
        webhookEventId,
        status,
        new Date(),
        order.id
      );
    }
    return NextResponse.json({ ok: true, order: updated });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Payments webhook endpoint (POST) available' });
}
