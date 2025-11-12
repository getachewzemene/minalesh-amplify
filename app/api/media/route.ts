import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { createMedia, getProductMedia } from '@/lib/media';
import prisma from '@/lib/prisma';

/**
 * Upload media for a product
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const altText = formData.get('altText') as string | null;
    const sortOrder = formData.get('sortOrder') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists and user has permission
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: { userId: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user is vendor or admin
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
    });

    const isAdminUser = payload.role === 'admin';
    const isOwner = product.vendor.userId === payload.userId;

    if (!isAdminUser && !isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to upload media for this product' },
        { status: 403 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create media with optimization
    const media = await createMedia({
      productId,
      file: buffer,
      filename: file.name,
      contentType: file.type,
      altText: altText || undefined,
      sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'An error occurred while uploading media' },
      { status: 500 }
    );
  }
}

/**
 * Get media for a product
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const media = await getProductMedia(productId);

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching media' },
      { status: 500 }
    );
  }
}
