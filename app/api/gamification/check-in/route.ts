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

// Base rewards configuration
const BASE_REWARD = 10 // Points for regular check-in
const STREAK_BONUS_MULTIPLIER = 2 // Bonus points per streak day
const WEEKLY_BONUS = 50 // Bonus for 7-day streak
const MONTHLY_BONUS = 200 // Bonus for 30-day streak

/**
 * @swagger
 * /api/gamification/check-in:
 *   get:
 *     tags: [Gamification]
 *     summary: Get check-in status
 *     description: Get user's current check-in status, streak, and next check-in info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkedInToday:
 *                   type: boolean
 *                 currentStreak:
 *                   type: integer
 *                 lastCheckIn:
 *                   type: string
 *                   format: date-time
 *                 nextReward:
 *                   type: integer
 *                 totalCheckIns:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's check-in
    const todayCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId: user.userId,
          checkInDate: today,
        },
      },
    })

    // Get latest check-in to determine current streak
    const latestCheckIn = await prisma.dailyCheckIn.findFirst({
      where: { userId: user.userId },
      orderBy: { checkInDate: 'desc' },
    })

    const totalCheckIns = await prisma.dailyCheckIn.count({
      where: { userId: user.userId },
    })

    const currentStreak = latestCheckIn?.streakCount || 0
    const nextReward = calculateReward(currentStreak + 1).totalReward

    return NextResponse.json({
      checkedInToday: !!todayCheckIn,
      currentStreak,
      lastCheckIn: latestCheckIn?.checkInDate,
      nextReward,
      totalCheckIns,
    })
  } catch (error) {
    console.error('Error fetching check-in status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in status' },
      { status: 500 }
    )
  }
}

function calculateReward(streakCount: number): { baseReward: number; bonusReward: number; totalReward: number } {
  const baseReward = BASE_REWARD
  let bonusReward = 0

  // Add bonus for streak
  if (streakCount > 1) {
    bonusReward += Math.floor(streakCount / 2) * STREAK_BONUS_MULTIPLIER
  }

  // Weekly bonus
  if (streakCount === 7) {
    bonusReward += WEEKLY_BONUS
  }

  // Monthly bonus
  if (streakCount === 30) {
    bonusReward += MONTHLY_BONUS
  }

  return {
    baseReward,
    bonusReward,
    totalReward: baseReward + bonusReward,
  }
}

/**
 * @swagger
 * /api/gamification/check-in:
 *   post:
 *     tags: [Gamification]
 *     summary: Perform daily check-in
 *     description: Record user's daily check-in and award points
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 streakCount:
 *                   type: integer
 *                 reward:
 *                   type: integer
 *                 bonusReward:
 *                   type: integer
 *                 totalReward:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Already checked in today
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const existingCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_checkInDate: {
          userId: user.userId,
          checkInDate: today,
        },
      },
    })

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      )
    }

    // Get yesterday's date
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get latest check-in to calculate streak
    const latestCheckIn = await prisma.dailyCheckIn.findFirst({
      where: { userId: user.userId },
      orderBy: { checkInDate: 'desc' },
    })

    let streakCount = 1

    if (latestCheckIn) {
      const latestDate = new Date(latestCheckIn.checkInDate)
      latestDate.setHours(0, 0, 0, 0)

      // Check if latest check-in was yesterday (continuing streak)
      if (latestDate.getTime() === yesterday.getTime()) {
        streakCount = latestCheckIn.streakCount + 1
      }
      // If there's a gap, streak resets to 1
    }

    // Calculate rewards
    const { baseReward, bonusReward, totalReward } = calculateReward(streakCount)

    // Create check-in and update loyalty points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Record check-in
      const checkIn = await tx.dailyCheckIn.create({
        data: {
          userId: user.userId,
          checkInDate: today,
          streakCount,
          reward: baseReward,
          bonusReward,
        },
      })

      // Get or create loyalty account
      let loyaltyAccount = await tx.loyaltyAccount.findUnique({
        where: { userId: user.userId },
      })

      if (!loyaltyAccount) {
        loyaltyAccount = await tx.loyaltyAccount.create({
          data: {
            userId: user.userId,
            points: 0,
            lifetimePoints: 0,
            tier: 'bronze',
            nextTierPoints: 1000,
          },
        })
      }

      // Add loyalty transaction
      await tx.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          points: totalReward,
          type: 'bonus',
          description: `Daily check-in (${streakCount}-day streak)`,
        },
      })

      // Update loyalty account
      const newPoints = loyaltyAccount.points + totalReward
      const newLifetimePoints = loyaltyAccount.lifetimePoints + totalReward

      // Calculate tier
      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze'
      let nextTierPoints = 1000

      if (newLifetimePoints >= 15000) {
        tier = 'platinum'
        nextTierPoints = 0
      } else if (newLifetimePoints >= 5000) {
        tier = 'gold'
        nextTierPoints = 15000 - newLifetimePoints
      } else if (newLifetimePoints >= 1000) {
        tier = 'silver'
        nextTierPoints = 5000 - newLifetimePoints
      } else {
        tier = 'bronze'
        nextTierPoints = 1000 - newLifetimePoints
      }

      await tx.loyaltyAccount.update({
        where: { id: loyaltyAccount.id },
        data: {
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          tier,
          nextTierPoints,
        },
      })

      return checkIn
    })

    // Generate message based on streak
    let message = `Check-in successful! +${totalReward} points`
    if (streakCount === 7) {
      message += ' 🎉 7-day streak bonus!'
    } else if (streakCount === 30) {
      message += ' 🎉🎉 30-day streak bonus!'
    } else if (bonusReward > 0) {
      message += ` (${streakCount}-day streak)`
    }

    return NextResponse.json({
      success: true,
      streakCount,
      reward: baseReward,
      bonusReward,
      totalReward,
      message,
    })
  } catch (error) {
    console.error('Error recording check-in:', error)
    return NextResponse.json(
      { error: 'Failed to record check-in' },
      { status: 500 }
    )
  }
}
