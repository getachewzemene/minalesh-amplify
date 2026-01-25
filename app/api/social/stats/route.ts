import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/src/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/social/stats
 * 
 * Get user's social sharing statistics and rewards
 * Requires authentication
 */
export async function GET(request: NextRequest) {
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

    // Get total shares by platform
    const sharesByPlatform = await prisma.productShare.groupBy({
      by: ['platform'],
      where: { userId },
      _count: {
        platform: true,
      },
    });

    const platformCounts: Record<string, number> = {
      whatsapp: 0,
      facebook: 0,
      twitter: 0,
      telegram: 0,
      copy_link: 0,
      qr_code: 0,
      native: 0,
    };

    sharesByPlatform.forEach((item) => {
      platformCounts[item.platform] = item._count.platform;
    });

    // Get total shares
    const totalShares = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);

    // Get loyalty points earned from sharing
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          where: {
            relatedType: 'product_share',
            type: 'earn',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    const pointsFromSharing = loyaltyAccount?.transactions.reduce(
      (sum, tx) => sum + tx.points,
      0
    ) || 0;

    // Get recent shares with product info
    const recentShares = await prisma.productShare.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get sharing milestones
    const milestones = [
      { shares: 10, reward: 50, achieved: totalShares >= 10 },
      { shares: 25, reward: 150, achieved: totalShares >= 25 },
      { shares: 50, reward: 350, achieved: totalShares >= 50 },
      { shares: 100, reward: 800, achieved: totalShares >= 100 },
      { shares: 250, reward: 2500, achieved: totalShares >= 250 },
    ];

    const nextMilestone = milestones.find(m => !m.achieved);

    return NextResponse.json({
      success: true,
      data: {
        totalShares,
        sharesByPlatform: platformCounts,
        pointsFromSharing,
        currentTier: loyaltyAccount?.tier || 'bronze',
        totalPoints: loyaltyAccount?.points || 0,
        recentShares,
        recentTransactions: loyaltyAccount?.transactions || [],
        milestones,
        nextMilestone,
        sharingRank: null, // Could add leaderboard ranking later
      },
    });
  } catch (error) {
    console.error('Error fetching social stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social statistics' },
      { status: 500 }
    );
  }
}
