import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  createReservation,
  getAvailableStock,
  releaseReservation,
} from '@/lib/inventory';
import { z } from 'zod';

const reserveSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().max(999),
  sessionId: z.string().optional(),
});

// POST /api/inventory/reserve - Create inventory reservation
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getUserFromToken(token) : null;

    const body = await request.json();
    const parsed = reserveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { productId, variantId, quantity, sessionId } = parsed.data;

    // Use userId if authenticated, otherwise use sessionId
    const userId = payload?.userId;
    const effectiveSessionId = sessionId || request.headers.get('x-session-id');

    if (!userId && !effectiveSessionId) {
      return NextResponse.json(
        { error: 'User authentication or session ID required' },
        { status: 401 }
      );
    }

    // Create reservation
    const result = await createReservation({
      productId,
      variantId,
      quantity,
      userId,
      sessionId: effectiveSessionId || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Insufficient') ? 409 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reservationId: result.reservationId,
      availableStock: result.availableStock,
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/reserve?reservationId=xxx - Release reservation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID required' },
        { status: 400 }
      );
    }

    const result = await releaseReservation(reservationId);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to release reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error releasing reservation:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/inventory/reserve?productId=xxx&variantId=yyy - Get available stock
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    const available = await getAvailableStock(
      productId,
      variantId || undefined
    );

    return NextResponse.json({
      productId,
      variantId: variantId || null,
      availableStock: available,
    });
  } catch (error) {
    console.error('Error getting available stock:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
