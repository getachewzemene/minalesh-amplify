import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { validateRequestBody, cartSchemas } from '@/lib/validation';
import { withApiLogger } from '@/lib/api-logger';
import * as CartService from '@/services/CartService';

// Helper function to get or create session ID from headers
function getSessionId(request: Request): string {
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    // Generate a new session ID if not provided
    return crypto.randomUUID();
  }
  return sessionId;
}

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart items
 *     description: Retrieve cart items for authenticated user or anonymous session
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 subtotal:
 *                   type: number
 *                 itemCount:
 *                   type: integer
 */
// GET - Fetch cart items
async function getHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);
    const sessionId = getSessionId(request);

    const cart = await CartService.getCart(payload?.userId, sessionId);

    return NextResponse.json(cart);
  } catch (error) {
    throw error;
  }
}

export const GET = withApiLogger(getHandler);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product to the cart for authenticated user or anonymous session
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Insufficient stock
 *       404:
 *         description: Product not found
 */
// POST - Add item to cart
async function postHandler(request: Request): Promise<NextResponse> {
  // Validate request body
  const validation = await validateRequestBody(request, cartSchemas.addItem);
  if (validation.success === false) {
    return validation.response;
  }
  
  const { productId, variantId, quantity } = validation.data;
  
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);
    const sessionId = getSessionId(request);

    const cartItem = await CartService.addToCart({
      userId: payload?.userId,
      sessionId: sessionId,
      productId,
      variantId,
      quantity,
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found' || error.message === 'Variant not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Insufficient stock') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    throw error;
  }
}

export const POST = withApiLogger(postHandler);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
// DELETE - Clear entire cart
async function deleteHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);
    const sessionId = getSessionId(request);

    await CartService.clearCart(payload?.userId, sessionId);

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    throw error;
  }
}

export const DELETE = withApiLogger(deleteHandler);
