import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { type PaymentMethod } from '@/types/payment';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: payload.userId },
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

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// Create a new order from client cart with selected payment method
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const addressSchema = z.object({
      name: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
      line1: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    });

    const schema = z.object({
      items: z.array(z.object({
        id: z.string().uuid().or(z.string().min(1)), // allow uuid or legacy id
        quantity: z.number().int().positive().max(999)
      })).min(1),
      paymentMethod: z.enum(['COD','TeleBirr','CBE','Awash','BankTransfer','Other']),
      paymentMeta: z.object({
        phone: z.string().min(7).max(20).optional(),
        reference: z.string().min(3).max(50).optional()
      }).optional(),
      shippingAddress: addressSchema.optional(),
      billingAddress: addressSchema.optional(),
    });

    const json = await request.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 });
    }
    const { items, paymentMethod, paymentMeta, shippingAddress, billingAddress } = parsed.data;

    if (paymentMethod === 'TeleBirr') {
      if (!paymentMeta?.phone || !paymentMeta?.reference) {
        return NextResponse.json({ error: 'TeleBirr phone and reference required' }, { status: 400 });
      }
    }

    // Fetch products to validate and get authoritative pricing/vendor
    const productIds = items.map(i => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, sku: true, vendorId: true }
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some products were not found' }, { status: 400 });
    }

    // Build order totals and check inventory
    let subtotal = 0;
    const orderItemsData = items.map((ci) => {
      const p = products.find(pp => pp.id === ci.id)!;
      const qty = Math.max(1, Number(ci.quantity || 1));
      const price = Number(p.price);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      return {
        vendorId: p.vendorId,
        productId: p.id,
        productName: p.name,
        productSku: p.sku ?? null,
        quantity: qty,
        price,
        total: lineTotal,
      };
    });

    // Pre-check inventory availability to provide a helpful error before attempting transaction
    const insufficient: { id: string; available: number; requested: number }[] = [];
    for (const oi of orderItemsData) {
      const prod = await prisma.product.findUnique({ where: { id: oi.productId }, select: { stockQuantity: true, name: true } });
      const available = prod?.stockQuantity ?? 0;
      if (oi.quantity > available) insufficient.push({ id: oi.productId, available, requested: oi.quantity });
    }

    if (insufficient.length > 0) {
      return NextResponse.json({ error: 'Insufficient stock', details: insufficient }, { status: 409 });
    }

    const orderNumber = `MIN-${Date.now()}`;

    // Atomic transaction: decrement stock and create order. Use transaction callback to allow early abort.
    // This provides immediate stock protection against overselling.
    // For enhanced reservation system, use inventory reservation API before order creation.
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Decrement stock for each product conditionally
        for (const oi of orderItemsData) {
          const updateRes = await tx.product.updateMany({
            where: { id: oi.productId, stockQuantity: { gte: oi.quantity } },
            data: { stockQuantity: { decrement: oi.quantity } },
          });
          if (updateRes.count === 0) {
            // Abort transaction if concurrent change caused insufficient stock
            throw new Error(`Insufficient stock for product ${oi.productId}`);
          }
        }

        const order = await tx.order.create({
          data: {
            userId: payload.userId,
            orderNumber,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod,
            paymentReference: paymentMethod === 'TeleBirr' ? paymentMeta?.reference : undefined,
            subtotal: subtotal.toFixed(2),
            shippingAmount: '0.00',
            taxAmount: '0.00',
            discountAmount: '0.00',
            totalAmount: subtotal.toFixed(2),
            currency: 'ETB',
            shippingAddress: shippingAddress || undefined,
            billingAddress: billingAddress || undefined,
            orderItems: {
              create: orderItemsData.map(oi => ({
                vendorId: oi.vendorId,
                productId: oi.productId,
                productName: oi.productName,
                productSku: oi.productSku,
                quantity: oi.quantity,
                price: oi.price,
                total: oi.total,
              }))
            },
            notes: paymentMethod === 'TeleBirr' ? `TeleBirr Phone: ${paymentMeta?.phone}` : undefined,
          },
          include: { orderItems: true }
        });

        return order;
      });

      return NextResponse.json({ success: true, order: result });
    } catch (txErr: unknown) {
      console.error('Transaction error creating order:', txErr);
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      // If transaction failed due to stock, return 409
      if (msg.includes('Insufficient stock')) {
        return NextResponse.json({ error: 'Insufficient stock (concurrent)', message: msg }, { status: 409 });
      }
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
