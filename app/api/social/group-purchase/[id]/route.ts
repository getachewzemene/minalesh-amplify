import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/social/group-purchase/[id]
 * 
 * Get details of a specific group purchase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupPurchaseId } = params;

    const groupPurchase = await prisma.groupPurchase.findUnique({
      where: { id: groupPurchaseId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        initiator: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!groupPurchase) {
      return NextResponse.json(
        { error: 'Group purchase not found' },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const now = new Date();
    const timeRemaining = groupPurchase.expiresAt.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

    return NextResponse.json({
      success: true,
      data: {
        ...groupPurchase,
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          milliseconds: Math.max(0, timeRemaining),
        },
        spotsRemaining: groupPurchase.maxMembers
          ? groupPurchase.maxMembers - groupPurchase.currentMembers
          : null,
        isComplete: groupPurchase.currentMembers >= groupPurchase.requiredMembers,
      },
    });
  } catch (error) {
    console.error('Error fetching group purchase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group purchase' },
      { status: 500 }
    );
  }
}
