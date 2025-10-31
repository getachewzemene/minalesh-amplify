import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

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

    const products = await prisma.product.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

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

    const product = await prisma.product.create({
      data: {
        ...data,
        vendorId: profile.id,
      },
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

    // Verify product ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || existingProduct.vendorId !== profile.id) {
      return NextResponse.json(
        { error: 'Product not found or not authorized' },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
