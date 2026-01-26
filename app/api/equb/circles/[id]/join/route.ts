import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/equb/circles/[id]/join
 * 
 * Join an existing Equb circle
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
    const { id: equbCircleId } = params;

    // Get Equb circle details
    const equbCircle = await prisma.equbCircle.findUnique({
      where: { id: equbCircleId },
      include: {
        members: true,
      },
    });

    if (!equbCircle) {
      return NextResponse.json(
        { error: 'Equb circle not found' },
        { status: 404 }
      );
    }

    // Validation checks
    if (equbCircle.status !== 'active') {
      return NextResponse.json(
        { error: 'This Equb circle is no longer active' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = equbCircle.members.find(m => m.userId === userId);
    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this Equb circle' },
        { status: 400 }
      );
    }

    // Check if circle is full
    if (equbCircle.members.length >= equbCircle.memberLimit) {
      return NextResponse.json(
        { error: 'This Equb circle is full' },
        { status: 400 }
      );
    }

    // Add user as member in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check current state with row lock
      const currentCircle = await tx.equbCircle.findUnique({
        where: { id: equbCircleId },
        include: { members: true },
      });

      if (!currentCircle) {
        throw new Error('Equb circle not found');
      }

      // Re-check if user is already a member (race condition safety)
      const isAlreadyMember = currentCircle.members.some(m => m.userId === userId);
      if (isAlreadyMember) {
        throw new Error('Already a member');
      }

      // Re-check if circle is full
      if (currentCircle.members.length >= currentCircle.memberLimit) {
        throw new Error('Circle is full');
      }

      // Find next available position
      const positions = currentCircle.members.map(m => m.position);
      let nextPosition = 1;
      while (positions.includes(nextPosition)) {
        nextPosition++;
      }

      // Add member
      const member = await tx.equbCircleMember.create({
        data: {
          equbCircleId,
          userId,
          position: nextPosition,
          isActive: true,
        },
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
      });

      // Get updated circle
      const updatedCircle = await tx.equbCircle.findUnique({
        where: { id: equbCircleId },
        include: {
          creator: {
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
              position: 'asc',
            },
          },
        },
      });

      return { member, updatedCircle };
    });

    const { member, updatedCircle } = result;

    return NextResponse.json({
      success: true,
      data: {
        member,
        equbCircle: updatedCircle,
      },
      message: `Successfully joined! You are member #${member.position}. ${
        updatedCircle!.members.length === updatedCircle!.memberLimit
          ? 'Circle is now complete!'
          : `${updatedCircle!.memberLimit - updatedCircle!.members.length} spots remaining.`
      }`,
    });
  } catch (error: any) {
    console.error('Error joining Equb circle:', error);
    
    // Handle specific transaction errors
    if (error.message === 'Already a member') {
      return NextResponse.json(
        { error: 'You are already a member of this Equb circle' },
        { status: 400 }
      );
    }
    
    if (error.message === 'Circle is full') {
      return NextResponse.json(
        { error: 'This Equb circle is full' },
        { status: 400 }
      );
    }
    
    if (error.message === 'Equb circle not found') {
      return NextResponse.json(
        { error: 'Equb circle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to join Equb circle' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/equb/circles/[id]/join
 * 
 * Get details of a specific Equb circle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: equbCircleId } = params;

    const equbCircle = await prisma.equbCircle.findUnique({
      where: { id: equbCircleId },
      include: {
        creator: {
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
            position: 'asc',
          },
        },
        contributions: {
          orderBy: {
            round: 'desc',
          },
          take: 10,
        },
        distributions: {
          orderBy: {
            round: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!equbCircle) {
      return NextResponse.json(
        { error: 'Equb circle not found' },
        { status: 404 }
      );
    }

    // Calculate additional info
    const totalPot = equbCircle.contributionAmount * equbCircle.memberLimit;
    const spotsRemaining = equbCircle.memberLimit - equbCircle.members.length;
    const isFull = spotsRemaining === 0;

    return NextResponse.json({
      success: true,
      data: {
        ...equbCircle,
        totalPot,
        spotsRemaining,
        isFull,
      },
    });
  } catch (error) {
    console.error('Error fetching Equb circle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Equb circle' },
      { status: 500 }
    );
  }
}
