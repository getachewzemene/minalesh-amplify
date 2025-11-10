import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// Helper function to get session ID from headers
function getSessionId(request: Request): string | null {
  return request.headers.get('x-session-id');
}

// PUT - Update cart item quantity
export async function PUT(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);
    const sessionId = getSessionId(request);

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    // Find the cart item
    const cartItem = await prisma.cart.findUnique({
      where: { id: params.itemId },
      include: {
        product: {
          select: { stockQuantity: true },
        },
        variant: {
          select: { stockQuantity: true },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payload?.userId && cartItem.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!payload && cartItem.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check stock availability
    const availableStock = cartItem.variant?.stockQuantity || cartItem.product.stockQuantity;
    if (availableStock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Update quantity
    const updatedItem = await prisma.cart.update({
      where: { id: params.itemId },
      data: { quantity },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            salePrice: true,
            images: true,
          },
        },
        variant: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating cart item' },
      { status: 500 }
    );
  }
}

// DELETE - Remove cart item
export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);
    const sessionId = getSessionId(request);

    // Find the cart item
    const cartItem = await prisma.cart.findUnique({
      where: { id: params.itemId },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payload?.userId && cartItem.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!payload && cartItem.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the item
    await prisma.cart.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'An error occurred while removing cart item' },
      { status: 500 }
    );
  }
}
