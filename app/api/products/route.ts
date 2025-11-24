import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import * as ProductService from '@/services/ProductService';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get vendor's products
 *     description: Retrieve all products for the authenticated vendor
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized as vendor
 */
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

    // Get user's vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Not authorized as vendor' },
        { status: 403 }
      );
    }

    const products = await ProductService.getVendorProducts(profile.id);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product for the authenticated vendor
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized as vendor
 */
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

    // Get user's vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Not authorized as vendor' },
        { status: 403 }
      );
    }

    const data = await request.json();

    const product = await ProductService.createProduct({
      ...data,
      vendorId: profile.id,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   patch:
 *     summary: Update a product
 *     description: Update an existing product owned by the authenticated vendor
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized as vendor
 *       404:
 *         description: Product not found
 */
export async function PATCH(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, ...data } = await request.json();

    // Get user's vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Not authorized as vendor' },
        { status: 403 }
      );
    }

    const product = await ProductService.updateProduct(
      { id, ...data },
      profile.id
    );

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found' || error.message.includes('not authorized')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   delete:
 *     summary: Delete a product
 *     description: Delete an existing product owned by the authenticated vendor
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized as vendor
 *       404:
 *         description: Product not found
 */
export async function DELETE(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get user's vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Not authorized as vendor' },
        { status: 403 }
      );
    }

    await ProductService.deleteProduct(id, profile.id);

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found' || error.message.includes('not authorized')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
