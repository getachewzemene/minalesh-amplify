import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * POST /api/equb/circles/[id]/contribute
 * 
 * Make a contribution to an Equb circle round
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
    const body = await request.json();
    
    const { amount, round } = body;

    // Get Equb circle and member details
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

    // Check if user is a member
    const member = equbCircle.members.find(m => m.userId === userId);
    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this Equb circle' },
        { status: 400 }
      );
    }

    if (!member.isActive) {
      return NextResponse.json(
        { error: 'Your membership is not active' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < equbCircle.contributionAmount) {
      return NextResponse.json(
        { 
          error: `Contribution amount must be at least ${equbCircle.contributionAmount} ETB`,
        },
        { status: 400 }
      );
    }

    // Validate round
    const currentRound = round || equbCircle.currentRound + 1;
    if (currentRound < 1 || currentRound > equbCircle.totalRounds) {
      return NextResponse.json(
        { error: 'Invalid round number' },
        { status: 400 }
      );
    }

    // Check if already contributed for this round
    const existingContribution = await prisma.equbContribution.findFirst({
      where: {
        equbCircleId,
        memberId: member.id,
        round: currentRound,
      },
    });

    if (existingContribution) {
      return NextResponse.json(
        { error: 'You have already contributed for this round' },
        { status: 400 }
      );
    }

    // Create contribution
    const contribution = await prisma.equbContribution.create({
      data: {
        equbCircleId,
        memberId: member.id,
        round: currentRound,
        amount,
      },
      include: {
        member: {
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

    // Check if all members have contributed for this round
    const roundContributions = await prisma.equbContribution.findMany({
      where: {
        equbCircleId,
        round: currentRound,
      },
    });

    const allContributed = roundContributions.length === equbCircle.members.length;

    // If all contributed, update current round and create distribution
    if (allContributed) {
      await prisma.$transaction(async (tx) => {
        // Update circle's current round
        await tx.equbCircle.update({
          where: { id: equbCircleId },
          data: {
            currentRound: currentRound,
          },
        });

        // Find the member who should receive this round (by position)
        const recipient = equbCircle.members.find(m => m.position === currentRound);
        
        if (recipient) {
          // Calculate total pot for this round
          const totalPot = roundContributions.reduce((sum, c) => sum + c.amount, 0);

          // Create distribution
          await tx.equbDistribution.create({
            data: {
              equbCircleId,
              recipientId: recipient.userId,
              round: currentRound,
              amount: totalPot,
              status: 'pending',
              scheduledDate: new Date(),
            },
          });
        }

        // If this was the last round, mark circle as completed
        if (currentRound === equbCircle.totalRounds) {
          await tx.equbCircle.update({
            where: { id: equbCircleId },
            data: {
              status: 'completed',
            },
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        contribution,
        roundComplete: allContributed,
        message: allContributed
          ? `Round ${currentRound} is complete! Distribution will be processed.`
          : `Contribution recorded. Waiting for ${equbCircle.members.length - roundContributions.length} more members.`,
      },
    });
  } catch (error) {
    console.error('Error recording contribution:', error);
    return NextResponse.json(
      { error: 'Failed to record contribution' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/equb/circles/[id]/contribute
 * 
 * Get contribution history for an Equb circle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: equbCircleId } = params;
    const { searchParams } = new URL(request.url);
    const round = searchParams.get('round');

    const where: any = {
      equbCircleId,
    };

    if (round) {
      where.round = parseInt(round);
    }

    const contributions = await prisma.equbContribution.findMany({
      where,
      include: {
        member: {
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
      orderBy: [
        { round: 'desc' },
        { paidAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: contributions,
      metadata: {
        count: contributions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}
