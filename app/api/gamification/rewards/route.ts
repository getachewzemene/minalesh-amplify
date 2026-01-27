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

// Define available rewards
export const REWARDS = {
  discount_5: {
    name: '5% Discount Coupon',
    description: 'Get 5% off your next purchase',
    pointsCost: 100,
    rewardType: 'discount',
    rewardValue: 5,
    iconUrl: '🎫',
  },
  discount_10: {
    name: '10% Discount Coupon',
    description: 'Get 10% off your next purchase',
    pointsCost: 200,
    rewardType: 'discount',
    rewardValue: 10,
    iconUrl: '🎟️',
  },
  discount_15: {
    name: '15% Discount Coupon',
    description: 'Get 15% off your next purchase',
    pointsCost: 300,
    rewardType: 'discount',
    rewardValue: 15,
    iconUrl: '🎁',
  },
  free_shipping: {
    name: 'Free Shipping',
    description: 'Get free shipping on your next order',
    pointsCost: 150,
    rewardType: 'free_shipping',
    rewardValue: 1,
    iconUrl: '📦',
  },
  cash_back_50: {
    name: '50 ETB Cash Back',
    description: 'Get 50 ETB credited to your account',
    pointsCost: 500,
    rewardType: 'cash_back',
    rewardValue: 50,
    iconUrl: '💵',
  },
  cash_back_100: {
    name: '100 ETB Cash Back',
    description: 'Get 100 ETB credited to your account',
    pointsCost: 1000,
    rewardType: 'cash_back',
    rewardValue: 100,
    iconUrl: '💰',
  },
  game_spin: {
    name: 'Spin Wheel Token',
    description: 'Get a free spin on the reward wheel',
    pointsCost: 50,
    rewardType: 'game_token',
    rewardValue: 1,
    iconUrl: '🎰',
  },
}

/**
 * @swagger
 * /api/gamification/rewards:
 *   get:
 *     tags: [Gamification]
 *     summary: Get available rewards
 *     description: Get all available rewards that can be redeemed with points
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rewards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rewards:
 *                   type: array
 *                   items:
 *                     type: object
 *                 userPoints:
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

    // Get user's current points
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.userId },
    })

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: user.userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          nextTierPoints: 1000,
        },
      })
    }

    const rewards = Object.entries(REWARDS).map(([key, reward]) => ({
      key,
      ...reward,
      canAfford: loyaltyAccount!.points >= reward.pointsCost,
    }))

    return NextResponse.json({
      rewards,
      userPoints: loyaltyAccount.points,
    })
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/gamification/rewards:
 *   post:
 *     tags: [Gamification]
 *     summary: Redeem reward
 *     description: Redeem a reward using loyalty points
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rewardKey
 *             properties:
 *               rewardKey:
 *                 type: string
 *                 enum: [discount_5, discount_10, discount_15, free_shipping, cash_back_50, cash_back_100, game_spin]
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 couponCode:
 *                   type: string
 *                 message:
 *                   type: string
 *                 remainingPoints:
 *                   type: integer
 *       400:
 *         description: Invalid reward or insufficient points
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
    const { rewardKey } = body

    if (!rewardKey) {
      return NextResponse.json(
        { error: 'Missing reward key' },
        { status: 400 }
      )
    }

    // Validate reward key
    const reward = REWARDS[rewardKey as keyof typeof REWARDS]
    if (!reward) {
      return NextResponse.json(
        { error: 'Invalid reward key' },
        { status: 400 }
      )
    }

    // Get user's loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.userId },
    })

    if (!loyaltyAccount || loyaltyAccount.points < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    // Redeem reward in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points
      await tx.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAccount.id,
          points: -reward.pointsCost,
          type: 'redeem',
          description: `Redeemed: ${reward.name}`,
        },
      })

      // Update loyalty account
      const newPoints = loyaltyAccount.points - reward.pointsCost

      await tx.loyaltyAccount.update({
        where: { id: loyaltyAccount.id },
        data: {
          points: newPoints,
        },
      })

      // Create coupon code for discount/free shipping rewards
      let couponCode: string | null = null
      if (reward.rewardType === 'discount' || reward.rewardType === 'free_shipping') {
        const code = `REWARD-${rewardKey.toUpperCase()}-${Date.now()}`
        
        const discountType = reward.rewardType === 'free_shipping' ? 'free_shipping' : 'percentage'
        const discountValue = reward.rewardType === 'free_shipping' ? 0 : reward.rewardValue

        await tx.coupon.create({
          data: {
            code,
            discountType,
            discountValue,
            status: 'active',
            usageLimit: 1,
            perUserLimit: 1,
            usageCount: 0,
            startsAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })

        couponCode = code
      }

      return { couponCode, remainingPoints: newPoints }
    })

    let message = `Reward redeemed successfully! You've received: ${reward.name}`
    if (result.couponCode) {
      message += `. Your coupon code is: ${result.couponCode}`
    }

    return NextResponse.json({
      success: true,
      couponCode: result.couponCode,
      message,
      remainingPoints: result.remainingPoints,
    })
  } catch (error) {
    console.error('Error redeeming reward:', error)
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}
