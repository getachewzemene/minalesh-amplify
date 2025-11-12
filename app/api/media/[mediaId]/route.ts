import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { updateMediaAltText, deleteMedia } from '@/lib/media';
import prisma from '@/lib/prisma';

/**
 * Update media alt text
 */
export async function PATCH(
  request: Request,
  { params }: { params: { mediaId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { altText } = await request.json();

    if (!altText) {
      return NextResponse.json(
        { error: 'Alt text is required' },
        { status: 400 }
      );
    }

    // Verify media exists and user has permission
    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      include: {
        product: {
          include: {
            vendor: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const isAdmin = process.env.ADMIN_EMAILS?.split(',').includes(payload.email);
    const isOwner = media.product.vendor.userId === payload.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to update this media' },
        { status: 403 }
      );
    }

    const updatedMedia = await updateMediaAltText(params.mediaId, altText);

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating media' },
      { status: 500 }
    );
  }
}

/**
 * Delete media
 */
export async function DELETE(
  request: Request,
  { params }: { params: { mediaId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify media exists and user has permission
    const media = await prisma.media.findUnique({
      where: { id: params.mediaId },
      include: {
        product: {
          include: {
            vendor: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    const isAdmin = process.env.ADMIN_EMAILS?.split(',').includes(payload.email);
    const isOwner = media.product.vendor.userId === payload.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to delete this media' },
        { status: 403 }
      );
    }

    await deleteMedia(params.mediaId);

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting media' },
      { status: 500 }
    );
  }
}
