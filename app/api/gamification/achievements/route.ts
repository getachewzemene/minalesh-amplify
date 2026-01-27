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

// Define available achievements
export const ACHIEVEMENTS = {
  first_purchase: {
    name: 'First Purchase',
    description: 'Complete your first order',
    points: 50,
    iconUrl: '🛍️',
  },
  power_reviewer: {
    name: 'Power Reviewer',
    description: 'Write 10 product reviews',
    points: 100,
    iconUrl: '⭐',
  },
  loyal_customer: {
    name: 'Loyal Customer',
    description: 'Make 25 purchases',
    points: 200,
    iconUrl: '🏆',
  },
  big_spender: {
    name: 'Big Spender',
    description: 'Spend 10,000 ETB in total',
    points: 300,
    iconUrl: '💰',
  },
  social_butterfly: {
    name: 'Social Butterfly',
    description: 'Share 20 products on social media',
    points: 75,
    iconUrl: '🦋',
  },
  early_bird: {
    name: 'Early Bird',
    description: 'Purchase during a flash sale',
    points: 50,
    iconUrl: '⏰',
  },
  check_in_warrior: {
    name: 'Check-in Warrior',
    description: 'Maintain a 30-day check-in streak',
    points: 250,
    iconUrl: '🔥',
  },
  referral_champion: {
    name: 'Referral Champion',
    description: 'Refer 10 friends who make a purchase',
    points: 500,
    iconUrl: '🎁',
  },
  wishlist_master: {
    name: 'Wishlist Master',
    description: 'Add 50 items to your wishlist',
    points: 50,
    iconUrl: '❤️',
  },
  bargain_hunter: {
    name: 'Bargain Hunter',
    description: 'Use 20 coupon codes',
    points: 150,
    iconUrl: '🎫',
  },
}

/**
 * @swagger
 * /api/gamification/achievements:
 *   get:
 *     tags: [Gamification]
 *     summary: Get achievements
 *     description: Get all available achievements and user's earned achievements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userOnly
 *         schema:
 *           type: boolean
 *         description: If true, return only user's earned achievements
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: array
 *                   items:
 *                     type: object
 *                 earned:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPoints:
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

    const { searchParams } = new URL(req.url)
    const userOnly = searchParams.get('userOnly') === 'true'

    // Get user's earned achievements
    const earnedAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.userId },
      orderBy: { earnedAt: 'desc' },
    })

    const earnedKeys = new Set(earnedAchievements.map((a) => a.achievementKey))
    const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0)

    if (userOnly) {
      return NextResponse.json({
        earned: earnedAchievements,
        totalPoints,
      })
    }

    // Get available achievements (not yet earned)
    const available = Object.entries(ACHIEVEMENTS)
      .filter(([key]) => !earnedKeys.has(key))
      .map(([key, achievement]) => ({
        key,
        ...achievement,
      }))

    return NextResponse.json({
      available,
      earned: earnedAchievements,
      totalPoints,
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/gamification/achievements:
 *   post:
 *     tags: [Gamification]
 *     summary: Award achievement
 *     description: Award an achievement to a user (internal/admin use)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - achievementKey
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               achievementKey:
 *                 type: string
 *                 enum: [first_purchase, power_reviewer, loyal_customer, big_spender, social_butterfly, early_bird, check_in_warrior, referral_champion, wishlist_master, bargain_hunter]
 *     responses:
 *       200:
 *         description: Achievement awarded successfully
 *       400:
 *         description: Invalid achievement or already earned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can manually award achievements
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, achievementKey } = body

    if (!userId || !achievementKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate achievement key
    const achievement = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS]
    if (!achievement) {
      return NextResponse.json(
        { error: 'Invalid achievement key' },
        { status: 400 }
      )
    }

    // Check if already earned
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementKey: {
          userId,
          achievementKey,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Achievement already earned' },
        { status: 400 }
      )
    }

    // Award achievement and add loyalty points
    const result = await prisma.$transaction(async (tx) => {
      // Create achievement
      const userAchievement = await tx.userAchievement.create({
        data: {
          userId,
          achievementKey,
          achievementName: achievement.name,
          description: achievement.description,
          iconUrl: achievement.iconUrl,
          points: achievement.points,
        },
      })

      // Get or create loyalty account
      let loyaltyAccount = await tx.loyaltyAccount.findUnique({
        where: { userId },
      })

      if (!loyaltyAccount) {
        loyaltyAccount = await tx.loyaltyAccount.create({
          data: {
            userId,
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
          points: achievement.points,
          type: 'bonus',
          description: `Achievement unlocked: ${achievement.name}`,
        },
      })

      // Update loyalty account
      const newPoints = loyaltyAccount.points + achievement.points
      const newLifetimePoints = loyaltyAccount.lifetimePoints + achievement.points

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

      return userAchievement
    })

    return NextResponse.json({
      success: true,
      achievement: result,
      message: `Achievement "${achievement.name}" unlocked! +${achievement.points} points`,
    })
  } catch (error) {
    console.error('Error awarding achievement:', error)
    return NextResponse.json(
      { error: 'Failed to award achievement' },
      { status: 500 }
    )
  }
}
