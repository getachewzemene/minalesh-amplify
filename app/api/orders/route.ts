import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';
import * as OrderService from '@/services/OrderService';

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     description: Retrieve all orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const orders = await OrderService.getUserOrders(payload!.userId);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order from cart items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, cod, bank_transfer]
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
// Create a new order from client cart with selected payment method
export async function POST(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
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

    // Call OrderService to create the order
    const result = await OrderService.createOrder({
      userId: payload!.userId,
      items,
      paymentMethod,
      paymentMeta,
      shippingAddress,
      billingAddress,
    });

    if (!result.success) {
      const statusCode = result.error?.includes('Insufficient stock') ? 409 : 400;
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
