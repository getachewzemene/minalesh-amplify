import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/equb/circles
 * 
 * Create a new Equb circle (Ethiopian rotating savings group)
 * Requires authentication
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    
    const {
      name,
      description,
      memberLimit,
      contributionAmount,
      frequency,
      startDate,
    } = body;

    // Validate required fields
    if (!name || !memberLimit || !contributionAmount || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, memberLimit, contributionAmount, frequency, startDate' },
        { status: 400 }
      );
    }

    // Validate memberLimit
    if (memberLimit < 2 || memberLimit > 50) {
      return NextResponse.json(
        { error: 'Member limit must be between 2 and 50' },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!['weekly', 'biweekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Frequency must be: weekly, biweekly, or monthly' },
        { status: 400 }
      );
    }

    // Validate contribution amount
    if (contributionAmount < 100) {
      return NextResponse.json(
        { error: 'Contribution amount must be at least 100 ETB' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    // Create Equb circle and add creator as first member in a transaction
    const equbCircle = await prisma.$transaction(async (tx) => {
      // Create the Equb circle
      const newCircle = await tx.equbCircle.create({
        data: {
          name,
          description,
          creatorId: userId,
          memberLimit,
          contributionAmount,
          frequency,
          startDate: start,
          totalRounds: memberLimit, // Each member gets one turn
          status: 'active',
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
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

      // Add creator as first member (position 1)
      await tx.equbCircleMember.create({
        data: {
          equbCircleId: newCircle.id,
          userId,
          position: 1,
          isActive: true,
        },
      });

      return newCircle;
    });

    return NextResponse.json({
      success: true,
      data: equbCircle,
      message: 'Equb circle created successfully! Invite friends to join.',
    });
  } catch (error) {
    console.error('Error creating Equb circle:', error);
    return NextResponse.json(
      { error: 'Failed to create Equb circle' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/equb/circles
 * 
 * Get active Equb circles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status') || 'active';

    const equbCircles = await prisma.equbCircle.findMany({
      where: {
        status: status as any,
      },
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
          select: {
            id: true,
            userId: true,
            position: true,
            isActive: true,
            joinedAt: true,
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
        _count: {
          select: {
            members: true,
            contributions: true,
          },
        },
      },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: equbCircles,
      metadata: {
        count: equbCircles.length,
      },
    });
  } catch (error) {
    console.error('Error fetching Equb circles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Equb circles' },
      { status: 500 }
    );
  }
}
