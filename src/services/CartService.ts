/**
 * Cart Service
 * 
 * Handles shopping cart operations including adding/removing items,
 * calculating totals, and managing cart state.
 */

import prisma from '@/lib/prisma';

export interface AddToCartRequest {
  userId?: string;
  sessionId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  userId: string | null;
  sessionId: string | null;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: any;
    salePrice: any;
    images: any;
    stockQuantity: number;
  };
  variant?: {
    id: string;
    name: string;
    price: any;
    salePrice: any;
    stockQuantity: number;
  } | null;
  unitPrice?: any;
  total?: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

/**
 * Get cart items for a user or session
 */
export async function getCart(userId?: string, sessionId?: string): Promise<CartSummary> {
  let cartItems;

  if (userId) {
    cartItems = await prisma.cart.findMany({
      where: { userId },
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
  } else if (sessionId) {
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
  } else {
    cartItems = [];
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

  return {
    items: itemsWithPricing,
    subtotal,
    itemCount: itemsWithPricing.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Add item to cart
 */
export async function addToCart(request: AddToCartRequest) {
  const { userId, sessionId, productId, variantId, quantity } = request;

  // Verify product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stockQuantity: true },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    if (variant.stockQuantity < quantity) {
      throw new Error('Insufficient stock');
    }
  } else if (product.stockQuantity < quantity) {
    throw new Error('Insufficient stock');
  }

  // Check if item already exists in cart
  const existingCartItem = await prisma.cart.findFirst({
    where: {
      ...(userId ? { userId } : { sessionId }),
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
        userId: userId || null,
        sessionId: userId ? null : sessionId || null,
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

  return cartItem;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
  userId?: string,
  sessionId?: string
) {
  const where: any = { id: cartItemId };
  if (userId) {
    where.userId = userId;
  } else if (sessionId) {
    where.sessionId = sessionId;
  }

  return await prisma.cart.update({
    where,
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
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartItemId: string,
  userId?: string,
  sessionId?: string
) {
  const where: any = { id: cartItemId };
  if (userId) {
    where.userId = userId;
  } else if (sessionId) {
    where.sessionId = sessionId;
  }

  return await prisma.cart.delete({
    where,
  });
}

/**
 * Clear entire cart
 */
export async function clearCart(userId?: string, sessionId?: string) {
  if (userId) {
    return await prisma.cart.deleteMany({
      where: { userId },
    });
  } else if (sessionId) {
    return await prisma.cart.deleteMany({
      where: { sessionId },
    });
  }
  return { count: 0 };
}

/**
 * Merge anonymous cart into user cart on login
 */
export async function mergeCart(userId: string, sessionId: string) {
  const sessionCart = await prisma.cart.findMany({
    where: { sessionId },
  });

  for (const item of sessionCart) {
    const existingItem = await prisma.cart.findFirst({
      where: {
        userId,
        productId: item.productId,
        variantId: item.variantId,
      },
    });

    if (existingItem) {
      // Merge quantities
      await prisma.cart.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + item.quantity },
      });
    } else {
      // Move item to user cart
      await prisma.cart.update({
        where: { id: item.id },
        data: { userId, sessionId: null },
      });
    }
  }

  // Delete remaining session cart items
  await prisma.cart.deleteMany({
    where: { sessionId },
  });
}
