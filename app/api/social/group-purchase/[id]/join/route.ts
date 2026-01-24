import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/src/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/social/group-purchase/[id]/join
 * 
 * Join an existing group purchase
 * Requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { id: groupPurchaseId } = params;

    // Get group purchase details
    const groupPurchase = await prisma.groupPurchase.findUnique({
      where: { id: groupPurchaseId },
      include: {
        product: true,
        members: true,
      },
    });

    if (!groupPurchase) {
      return NextResponse.json(
        { error: 'Group purchase not found' },
        { status: 404 }
      );
    }

    // Validation checks
    if (groupPurchase.status !== 'active') {
      return NextResponse.json(
        { error: 'This group purchase is no longer active' },
        { status: 400 }
      );
    }

    if (new Date() > groupPurchase.expiresAt) {
      // Update status to expired
      await prisma.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: { status: 'expired' },
      });
      
      return NextResponse.json(
        { error: 'This group purchase has expired' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = groupPurchase.members.find(m => m.userId === userId);
    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group purchase' },
        { status: 400 }
      );
    }

    // Check if group is full
    if (groupPurchase.maxMembers && groupPurchase.currentMembers >= groupPurchase.maxMembers) {
      return NextResponse.json(
        { error: 'This group purchase is full' },
        { status: 400 }
      );
    }

    // Check if product has enough stock
    if (groupPurchase.product.stockQuantity < (groupPurchase.currentMembers + 1)) {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 400 }
      );
    }

    // Add user as member
    const member = await prisma.groupPurchaseMember.create({
      data: {
        groupPurchaseId,
        userId,
        isPaid: false,
      },
    });

    // Update current member count
    const updatedGroupPurchase = await prisma.groupPurchase.update({
      where: { id: groupPurchaseId },
      data: {
        currentMembers: {
          increment: 1,
        },
      },
      include: {
        product: true,
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
        },
      },
    });

    // Check if group purchase is now complete
    if (updatedGroupPurchase.currentMembers >= updatedGroupPurchase.requiredMembers) {
      await prisma.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // TODO: Send notifications to all members
      // TODO: Create orders for all members
    }

    return NextResponse.json({
      success: true,
      data: {
        member,
        groupPurchase: updatedGroupPurchase,
      },
      message: updatedGroupPurchase.currentMembers >= updatedGroupPurchase.requiredMembers
        ? 'Successfully joined! Group purchase is now complete.'
        : 'Successfully joined the group purchase!',
    });
  } catch (error) {
    console.error('Error joining group purchase:', error);
    return NextResponse.json(
      { error: 'Failed to join group purchase' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/group-purchase/[id]/join
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
