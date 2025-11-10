import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// POST - Merge anonymous cart with user cart on login
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get anonymous cart items
    const anonymousCartItems = await prisma.cart.findMany({
      where: { sessionId },
    });

    if (anonymousCartItems.length === 0) {
      return NextResponse.json({ 
        message: 'No anonymous cart items to merge',
        mergedCount: 0 
      });
    }

    // Get existing user cart items
    const userCartItems = await prisma.cart.findMany({
      where: { userId: payload.userId },
    });

    let mergedCount = 0;
    let updatedCount = 0;

    // Merge logic: for each anonymous cart item
    for (const anonItem of anonymousCartItems) {
      // Check if user already has this product/variant in cart
      const existingUserItem = userCartItems.find(
        item => 
          item.productId === anonItem.productId &&
          item.variantId === anonItem.variantId
      );

      if (existingUserItem) {
        // Update existing item - add quantities together
        await prisma.cart.update({
          where: { id: existingUserItem.id },
          data: { 
            quantity: existingUserItem.quantity + anonItem.quantity 
          },
        });
        updatedCount++;
        
        // Delete the anonymous cart item
        await prisma.cart.delete({
          where: { id: anonItem.id },
        });
      } else {
        // Move anonymous item to user's cart
        await prisma.cart.update({
          where: { id: anonItem.id },
          data: {
            userId: payload.userId,
            sessionId: null,
          },
        });
        mergedCount++;
      }
    }

    return NextResponse.json({
      message: 'Cart merged successfully',
      mergedCount,
      updatedCount,
      totalItems: mergedCount + updatedCount,
    });
  } catch (error) {
    console.error('Error merging cart:', error);
    return NextResponse.json(
      { error: 'An error occurred while merging cart' },
      { status: 500 }
    );
  }
}
