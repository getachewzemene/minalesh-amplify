import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
)

async function verifyAuth(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

/**
 * @swagger
 * /api/gamification/leaderboard:
 *   get:
 *     tags: [Gamification]
 *     summary: Get leaderboard
 *     description: Get top users by points, achievements, or check-in streaks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [points, achievements, streaks]
 *           default: points
 *         description: Type of leaderboard
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                 currentUser:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'points') as 'points' | 'achievements' | 'streaks'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    let leaderboard: any[] = []
    let currentUserRank: any = null

    if (type === 'points') {
      // Leaderboard by lifetime points
      const topUsers = await prisma.loyaltyAccount.findMany({
        take: limit,
        orderBy: { lifetimePoints: 'desc' },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      })

      leaderboard = topUsers.map((account, index) => ({
        rank: index + 1,
        userId: account.userId,
        displayName: account.user.profile?.displayName || 
                    `${account.user.profile?.firstName || ''} ${account.user.profile?.lastName || ''}`.trim() || 
                    'Anonymous',
        avatarUrl: account.user.profile?.avatarUrl,
        points: account.lifetimePoints,
        tier: account.tier,
      }))

      // Get current user's rank
      const currentUserAccount = await prisma.loyaltyAccount.findUnique({
        where: { userId: user.userId },
      })

      if (currentUserAccount) {
        const usersAbove = await prisma.loyaltyAccount.count({
          where: {
            lifetimePoints: { gt: currentUserAccount.lifetimePoints },
          },
        })

        currentUserRank = {
          rank: usersAbove + 1,
          points: currentUserAccount.lifetimePoints,
          tier: currentUserAccount.tier,
        }
      }
    } else if (type === 'achievements') {
      // Leaderboard by achievement count
      const achievementCounts = await prisma.userAchievement.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { points: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      })

      const userIds = achievementCounts.map((a) => a.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: {
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      })

      const userMap = new Map(users.map((u) => [u.id, u]))

      leaderboard = achievementCounts.map((count, index) => {
        const user = userMap.get(count.userId)
        return {
          rank: index + 1,
          userId: count.userId,
          displayName: user?.profile?.displayName || 
                      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 
                      'Anonymous',
          avatarUrl: user?.profile?.avatarUrl,
          achievementCount: count._count.id,
          achievementPoints: count._sum.points || 0,
        }
      })

      // Get current user's rank
      const currentUserCount = await prisma.userAchievement.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { points: true },
        where: { userId: user.userId },
      })

      if (currentUserCount.length > 0) {
        const usersAbove = await prisma.userAchievement.groupBy({
          by: ['userId'],
          _count: { id: true },
          having: {
            id: { _count: { gt: currentUserCount[0]._count.id } },
          },
        })

        currentUserRank = {
          rank: usersAbove.length + 1,
          achievementCount: currentUserCount[0]._count.id,
          achievementPoints: currentUserCount[0]._sum.points || 0,
        }
      }
    } else if (type === 'streaks') {
      // Leaderboard by check-in streaks
      // Get the maximum streak for each user
      const streakData = await prisma.dailyCheckIn.groupBy({
        by: ['userId'],
        _max: { streakCount: true },
        orderBy: { _max: { streakCount: 'desc' } },
        take: limit,
      })

      const userIds = streakData.map((s) => s.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: {
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          dailyCheckIns: {
            where: { streakCount: { gte: 1 } },
            orderBy: { checkInDate: 'desc' },
            take: 1,
          },
        },
      })

      const userMap = new Map(users.map((u) => [u.id, u]))

      leaderboard = streakData.map((data, index) => {
        const user = userMap.get(data.userId)
        const lastCheckIn = user?.dailyCheckIns[0]
        return {
          rank: index + 1,
          userId: data.userId,
          displayName: user?.profile?.displayName || 
                      `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 
                      'Anonymous',
          avatarUrl: user?.profile?.avatarUrl,
          streak: data._max.streakCount || 0,
          lastCheckIn: lastCheckIn?.checkInDate,
        }
      })

      // Get current user's rank
      const currentUserStreak = await prisma.dailyCheckIn.groupBy({
        by: ['userId'],
        _max: { streakCount: true },
        where: { userId: user.userId },
      })

      if (currentUserStreak.length > 0) {
        const usersAbove = await prisma.dailyCheckIn.groupBy({
          by: ['userId'],
          _max: { streakCount: true },
          having: {
            streakCount: { _max: { gt: currentUserStreak[0]._max.streakCount || 0 } },
          },
        })

        const currentUserCheckIn = await prisma.dailyCheckIn.findFirst({
          where: { userId: user.userId },
          orderBy: { checkInDate: 'desc' },
        })

        currentUserRank = {
          rank: usersAbove.length + 1,
          streak: currentUserStreak[0]._max.streakCount || 0,
          lastCheckIn: currentUserCheckIn?.checkInDate,
        }
      }
    }

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserRank,
      type,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
