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

    // Add user as member and update count in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check current state with row lock
      const currentGroupPurchase = await tx.groupPurchase.findUnique({
        where: { id: groupPurchaseId },
        include: { members: true },
      });

      if (!currentGroupPurchase) {
        throw new Error('Group purchase not found');
      }

      // Re-check if user is already a member (race condition safety)
      const isAlreadyMember = currentGroupPurchase.members.some(m => m.userId === userId);
      if (isAlreadyMember) {
        throw new Error('Already a member');
      }

      // Re-check if group is full
      if (currentGroupPurchase.maxMembers && 
          currentGroupPurchase.currentMembers >= currentGroupPurchase.maxMembers) {
        throw new Error('Group is full');
      }

      // Add member
      const member = await tx.groupPurchaseMember.create({
        data: {
          groupPurchaseId,
          userId,
          isPaid: false,
        },
      });

      // Update member count
      const updatedGroupPurchase = await tx.groupPurchase.update({
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

      return { member, updatedGroupPurchase };
    });

    const { member, updatedGroupPurchase } = result;

    // Check if group purchase is now complete
    if (updatedGroupPurchase.currentMembers >= updatedGroupPurchase.requiredMembers) {
      // Mark as completed
      await prisma.groupPurchase.update({
        where: { id: groupPurchaseId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Note: Order creation and notifications are handled by background workers
      // See: /app/api/cron/process-group-purchases for automated order processing
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
  } catch (error: unknown) {
    console.error('Error joining group purchase:', error);
    
    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message === 'Already a member') {
        return NextResponse.json(
          { error: 'You are already a member of this group purchase' },
          { status: 400 }
        );
      }
      
      if (error.message === 'Group is full') {
        return NextResponse.json(
          { error: 'This group purchase is full' },
          { status: 400 }
        );
      }
      
      if (error.message === 'Group purchase not found') {
        return NextResponse.json(
          { error: 'Group purchase not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to join group purchase' },
      { status: 500 }
    );
  }
}
