import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * POST /api/flash-sales/[id]/register
 * Pre-register for a flash sale
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if flash sale exists
    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
    });

    if (!flashSale) {
      return NextResponse.json(
        { error: 'Flash sale not found' },
        { status: 404 }
      );
    }

    // Check if flash sale is active
    if (!flashSale.isActive) {
      return NextResponse.json(
        { error: 'Flash sale is not active' },
        { status: 400 }
      );
    }

    // Check if flash sale has already started
    const now = new Date();
    if (now >= flashSale.startsAt) {
      return NextResponse.json(
        { error: 'Flash sale has already started. Registration is no longer available.' },
        { status: 400 }
      );
    }

    // Check if flash sale has ended
    if (now >= flashSale.endsAt) {
      return NextResponse.json(
        { error: 'Flash sale has ended' },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingRegistration = await prisma.flashSaleRegistration.findUnique({
      where: {
        userId_flashSaleId: {
          userId: payload.userId,
          flashSaleId: id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({
        message: 'Already registered for this flash sale',
        registration: existingRegistration,
      });
    }

    // Create registration
    const registration = await prisma.flashSaleRegistration.create({
      data: {
        userId: payload.userId,
        flashSaleId: id,
      },
    });

    return NextResponse.json({
      message: 'Successfully registered for flash sale',
      registration,
    });
  } catch (error) {
    console.error('Error registering for flash sale:', error);
    return NextResponse.json(
      { error: 'Failed to register for flash sale' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flash-sales/[id]/register
 * Check if user is registered for a flash sale
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ registered: false });
    }

    const { id } = params;

    const registration = await prisma.flashSaleRegistration.findUnique({
      where: {
        userId_flashSaleId: {
          userId: payload.userId,
          flashSaleId: id,
        },
      },
    });

    return NextResponse.json({
      registered: !!registration,
      registration,
    });
  } catch (error) {
    console.error('Error checking flash sale registration:', error);
    return NextResponse.json(
      { error: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flash-sales/[id]/register
 * Unregister from a flash sale
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Delete registration if it exists
    await prisma.flashSaleRegistration.deleteMany({
      where: {
        userId: payload.userId,
        flashSaleId: id,
      },
    });

    return NextResponse.json({
      message: 'Successfully unregistered from flash sale',
    });
  } catch (error) {
    console.error('Error unregistering from flash sale:', error);
    return NextResponse.json(
      { error: 'Failed to unregister from flash sale' },
      { status: 500 }
    );
  }
}
