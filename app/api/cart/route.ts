import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { validateRequestBody, cartSchemas } from '@/lib/validation';
import { withApiLogger } from '@/lib/api-logger';

// Helper function to get or create session ID from headers
function getSessionId(request: Request): string {
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    // Generate a new session ID if not provided
    return crypto.randomUUID();
  }
  return sessionId;
}

// Helper function to calculate cart item price
async function calculateItemPrice(productId: string, variantId: string | null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, salePrice: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { price: true, salePrice: true },
    });

    if (variant) {
      return variant.salePrice || variant.price || product.salePrice || product.price;
    }
  }

  return product.salePrice || product.price;
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

    let cartItems;

    if (payload?.userId) {
      // Get cart for authenticated user
      cartItems = await prisma.cart.findMany({
        where: { userId: payload.userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              salePrice: true,
              images: true,
              stockQuantity: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              price: true,
              salePrice: true,
              stockQuantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Get cart for anonymous user using session
      cartItems = await prisma.cart.findMany({
        where: { sessionId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              salePrice: true,
              images: true,
              stockQuantity: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              price: true,
              salePrice: true,
              stockQuantity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Calculate pricing for each item
    const itemsWithPricing = cartItems.map(item => {
      const basePrice = item.variant?.salePrice || item.variant?.price || item.product.salePrice || item.product.price;
      const total = Number(basePrice) * item.quantity;

      return {
        ...item,
        unitPrice: basePrice,
        total,
      };
    });

    const subtotal = itemsWithPricing.reduce((sum, item) => sum + item.total, 0);

    return NextResponse.json({
      items: itemsWithPricing,
      subtotal,
      itemCount: itemsWithPricing.reduce((sum, item) => sum + item.quantity, 0),
    });
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

    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stockQuantity: true },
      });

      if (!variant) {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        );
      }

      if (variant.stockQuantity < quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
    } else if (product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cart.findFirst({
      where: {
        ...(payload?.userId ? { userId: payload.userId } : { sessionId }),
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity of existing item
      cartItem = await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
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
    } else {
      // Add new item to cart
      cartItem = await prisma.cart.create({
        data: {
          userId: payload?.userId || null,
          sessionId: payload?.userId ? null : sessionId,
          productId,
          variantId: variantId || null,
          quantity,
        },
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
    }

    return NextResponse.json(cartItem);
  } catch (error) {
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

    if (payload?.userId) {
      await prisma.cart.deleteMany({
        where: { userId: payload.userId },
      });
    } else {
      await prisma.cart.deleteMany({
        where: { sessionId },
      });
    }

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    throw error;
  }
}

export const DELETE = withApiLogger(deleteHandler);
