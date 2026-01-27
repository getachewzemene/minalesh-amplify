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

// Game configurations
const GAMES = {
  spin_wheel: {
    name: 'Spin the Wheel',
    description: 'Spin the wheel for a chance to win points or discounts',
    iconUrl: '🎡',
    maxPlaysPerDay: 3,
    rewards: [
      { label: '10 Points', type: 'points', value: 10, probability: 0.3 },
      { label: '25 Points', type: 'points', value: 25, probability: 0.2 },
      { label: '50 Points', type: 'points', value: 50, probability: 0.15 },
      { label: '100 Points', type: 'points', value: 100, probability: 0.1 },
      { label: '5% Discount', type: 'discount', value: 5, probability: 0.15 },
      { label: '10% Discount', type: 'discount', value: 10, probability: 0.05 },
      { label: 'Free Shipping', type: 'free_shipping', value: 1, probability: 0.05 },
    ],
  },
  scratch_card: {
    name: 'Scratch Card',
    description: 'Reveal hidden rewards',
    iconUrl: '🎴',
    maxPlaysPerDay: 2,
    rewards: [
      { label: '20 Points', type: 'points', value: 20, probability: 0.35 },
      { label: '50 Points', type: 'points', value: 50, probability: 0.25 },
      { label: '100 Points', type: 'points', value: 100, probability: 0.15 },
      { label: '5% Discount', type: 'discount', value: 5, probability: 0.15 },
      { label: '10% Discount', type: 'discount', value: 10, probability: 0.1 },
    ],
  },
  quiz: {
    name: 'Product Quiz',
    description: 'Answer questions about products and earn points',
    iconUrl: '❓',
    maxPlaysPerDay: 5,
    rewards: [
      { label: '10 Points', type: 'points', value: 10, probability: 0.4 },
      { label: '25 Points', type: 'points', value: 25, probability: 0.35 },
      { label: '50 Points', type: 'points', value: 50, probability: 0.25 },
    ],
  },
  survey: {
    name: 'Customer Survey',
    description: 'Complete surveys and earn rewards',
    iconUrl: '📋',
    maxPlaysPerDay: 1,
    rewards: [
      { label: '30 Points', type: 'points', value: 30, probability: 0.5 },
      { label: '50 Points', type: 'points', value: 50, probability: 0.3 },
      { label: '5% Discount', type: 'discount', value: 5, probability: 0.2 },
    ],
  },
  mini_game: {
    name: 'Mini Game',
    description: 'Play fun mini-games and win rewards',
    iconUrl: '🎮',
    maxPlaysPerDay: 5,
    rewards: [
      { label: '15 Points', type: 'points', value: 15, probability: 0.35 },
      { label: '30 Points', type: 'points', value: 30, probability: 0.25 },
      { label: '75 Points', type: 'points', value: 75, probability: 0.15 },
      { label: '5% Discount', type: 'discount', value: 5, probability: 0.15 },
      { label: 'Free Shipping', type: 'free_shipping', value: 1, probability: 0.1 },
    ],
  },
}

function selectRandomReward(gameType: keyof typeof GAMES) {
  const game = GAMES[gameType]
  const random = Math.random()
  let cumulative = 0

  for (const reward of game.rewards) {
    cumulative += reward.probability
    if (random <= cumulative) {
      return reward
    }
  }

  // Fallback to first reward
  return game.rewards[0]
}

/**
 * @swagger
 * /api/gamification/games:
 *   get:
 *     tags: [Gamification]
 *     summary: Get available games
 *     description: Get all available games and user's play statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 playStats:
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's play counts for each game type
    const playStats: Record<string, { playsToday: number; maxPlays: number; canPlay: boolean }> = {}

    for (const [gameType, game] of Object.entries(GAMES)) {
      const count = await prisma.gameScore.count({
        where: {
          userId: user.userId,
          gameType: gameType as 'spin_wheel' | 'scratch_card' | 'quiz' | 'survey' | 'mini_game',
          playedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      })

      playStats[gameType] = {
        playsToday: count,
        maxPlays: game.maxPlaysPerDay,
        canPlay: count < game.maxPlaysPerDay,
      }
    }

    const games = Object.entries(GAMES).map(([key, game]) => ({
      key,
      name: game.name,
      description: game.description,
      iconUrl: game.iconUrl,
      maxPlaysPerDay: game.maxPlaysPerDay,
      ...playStats[key],
    }))

    return NextResponse.json({
      games,
      playStats,
    })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/gamification/games:
 *   post:
 *     tags: [Gamification]
 *     summary: Play a game
 *     description: Play a game and receive a random reward
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameType
 *             properties:
 *               gameType:
 *                 type: string
 *                 enum: [spin_wheel, scratch_card, quiz, survey, mini_game]
 *               score:
 *                 type: integer
 *                 description: Optional score for quiz/mini-game
 *               metadata:
 *                 type: object
 *                 description: Optional game-specific data
 *     responses:
 *       200:
 *         description: Game played successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reward:
 *                   type: object
 *                 couponCode:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid game or daily limit reached
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { gameType, score = 0, metadata = {} } = body

    if (!gameType) {
      return NextResponse.json(
        { error: 'Missing game type' },
        { status: 400 }
      )
    }

    // Validate game type
    const game = GAMES[gameType as keyof typeof GAMES]
    if (!game) {
      return NextResponse.json(
        { error: 'Invalid game type' },
        { status: 400 }
      )
    }

    // Check daily play limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const playCount = await prisma.gameScore.count({
      where: {
        userId: user.userId,
        gameType: gameType as 'spin_wheel' | 'scratch_card' | 'quiz' | 'survey' | 'mini_game',
        playedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (playCount >= game.maxPlaysPerDay) {
      return NextResponse.json(
        { error: `Daily play limit reached for ${game.name}` },
        { status: 400 }
      )
    }

    // Select random reward
    const reward = selectRandomReward(gameType as keyof typeof GAMES)

    // Process game and reward in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Record game play
      await tx.gameScore.create({
        data: {
          userId: user.userId,
          gameType: gameType as 'spin_wheel' | 'scratch_card' | 'quiz' | 'survey' | 'mini_game',
          score,
          reward: reward.value,
          rewardType: reward.type,
          metadata: { ...metadata, rewardLabel: reward.label },
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

      let couponCode: string | null = null

      // Process reward based on type
      if (reward.type === 'points') {
        // Add loyalty transaction
        await tx.loyaltyTransaction.create({
          data: {
            accountId: loyaltyAccount.id,
            points: reward.value,
            type: 'bonus',
            description: `${game.name}: ${reward.label}`,
          },
        })

        // Update loyalty account
        const newPoints = loyaltyAccount.points + reward.value
        const newLifetimePoints = loyaltyAccount.lifetimePoints + reward.value

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
      } else if (reward.type === 'discount' || reward.type === 'free_shipping') {
        // Create coupon code
        const code = `GAME-${gameType.toUpperCase()}-${Date.now()}`
        
        const discountType = reward.type === 'free_shipping' ? 'free_shipping' : 'percentage'
        const discountValue = reward.type === 'free_shipping' ? 0 : reward.value

        await tx.coupon.create({
          data: {
            code,
            discountType,
            discountValue,
            status: 'active',
            maxUses: 1,
            maxUsesPerUser: 1,
            usageCount: 0,
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        })

        couponCode = code
      }

      return { reward, couponCode }
    })

    let message = `Congratulations! You won: ${result.reward.label}`
    if (result.couponCode) {
      message += `. Your coupon code is: ${result.couponCode}`
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
      couponCode: result.couponCode,
      message,
      playsRemaining: game.maxPlaysPerDay - playCount - 1,
    })
  } catch (error) {
    console.error('Error playing game:', error)
    return NextResponse.json(
      { error: 'Failed to play game' },
      { status: 500 }
    )
  }
}
