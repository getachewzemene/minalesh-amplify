import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

// GET notification preferences
export async function GET(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: payload!.userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: payload!.userId,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT/PATCH update notification preferences
export async function PUT(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const data = await request.json();

    // Validate data structure
    const allowedFields = [
      'emailOrderConfirm',
      'emailShippingUpdate',
      'emailPromotions',
      'emailNewsletter',
      'inAppOrderUpdates',
      'inAppPromotions',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in data && typeof data[field] === 'boolean') {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: payload!.userId },
      update: updateData,
      create: {
        userId: payload!.userId,
        ...updateData,
      },
    });

    return NextResponse.json(preferences);
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
