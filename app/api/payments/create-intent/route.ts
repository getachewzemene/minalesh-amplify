import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';
import * as PaymentService from '@/services/PaymentService';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

const createIntentSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive().max(999),
    })
  ).min(1) as z.ZodType<{ productId: string; variantId?: string; quantity: number; }[]>,
  shippingAddress: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
      line1: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  billingAddress: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
      line1: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      postalCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  couponCode: z.string().optional(),
  shippingMethodId: z.string().uuid().optional(),
  captureMethod: z.enum(['automatic', 'manual']).default('automatic'),
  // Buyer Protection options
  enableBuyerProtection: z.boolean().optional().default(false),
  enableInsurance: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent
 *     description: Create a Stripe payment intent and reserve inventory
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     variantId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               couponCode:
 *                 type: string
 *               shippingMethodId:
 *                 type: string
 *               captureMethod:
 *                 type: string
 *                 enum: [automatic, manual]
 *               enableBuyerProtection:
 *                 type: boolean
 *                 description: Enable buyer protection (2.5% fee)
 *               enableInsurance:
 *                 type: boolean
 *                 description: Enable insurance for high-value items (1.5% fee)
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
async function postHandler(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { 
      items, 
      shippingAddress, 
      billingAddress, 
      couponCode, 
      shippingMethodId, 
      captureMethod,
      enableBuyerProtection,
      enableInsurance,
    } = parsed.data;

    // Call PaymentService to create payment intent
    const result = await PaymentService.createPaymentIntent({
      userId: payload!.userId,
      items,
      shippingAddress,
      billingAddress,
      couponCode,
      shippingMethodId,
      captureMethod,
      enableBuyerProtection,
      enableInsurance,
    });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 400 : 
                         result.error?.includes('reserve inventory') ? 409 : 500;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      reservations: result.reservations,
      stripePaymentIntent: result.stripePaymentIntent,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating payment intent' },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting for payment endpoints
export const POST = withApiLogger(
  withRateLimit(postHandler, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // Only 5 payment intents per minute
  })
);
