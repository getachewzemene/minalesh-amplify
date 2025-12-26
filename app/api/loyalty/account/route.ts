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

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000,
}

function calculateTier(lifetimePoints: number): { tier: string; nextTierPoints: number } {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) {
    return { tier: 'platinum', nextTierPoints: 0 }
  } else if (lifetimePoints >= TIER_THRESHOLDS.gold) {
    return { tier: 'gold', nextTierPoints: TIER_THRESHOLDS.platinum - lifetimePoints }
  } else if (lifetimePoints >= TIER_THRESHOLDS.silver) {
    return { tier: 'silver', nextTierPoints: TIER_THRESHOLDS.gold - lifetimePoints }
  } else {
    return { tier: 'bronze', nextTierPoints: TIER_THRESHOLDS.silver - lifetimePoints }
  }
}

/**
 * @swagger
 * /api/loyalty/account:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty account
 *     description: Retrieve current user's loyalty account with points and tier information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty account retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    // Create account if it doesn't exist
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId: user.userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          nextTierPoints: TIER_THRESHOLDS.silver,
        },
        include: {
          transactions: true,
        },
      })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error fetching loyalty account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty account' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/loyalty/account:
 *   post:
 *     tags: [Loyalty]
 *     summary: Add loyalty points
 *     description: Add points to user's loyalty account (internal use for order completion, reviews, etc.)
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
 *               - points
 *               - type
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               points:
 *                 type: integer
 *                 description: Number of points to add (positive for earn, negative for redeem)
 *               type:
 *                 type: string
 *                 enum: [purchase, review, referral, redeem, bonus]
 *               description:
 *                 type: string
 *               relatedId:
 *                 type: string
 *                 format: uuid
 *                 description: Related order/review ID
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Points added successfully
 *       400:
 *         description: Invalid request
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can manually add points
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, points, type, description, relatedId, expiresAt } = body

    if (!userId || !points || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    })

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          nextTierPoints: TIER_THRESHOLDS.silver,
        },
      })
    }

    // Add transaction and update account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account!.id,
          points,
          type,
          description,
          relatedId,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      })

      // Update account points
      const newPoints = Math.max(0, account!.points + points)
      const newLifetimePoints =
        points > 0 ? account!.lifetimePoints + points : account!.lifetimePoints

      const { tier, nextTierPoints } = calculateTier(newLifetimePoints)

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account!.id },
        data: {
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          tier: tier as 'bronze' | 'silver' | 'gold' | 'platinum',
          nextTierPoints,
        },
      })

      return { transaction, account: updatedAccount }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error adding loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to add points' },
      { status: 500 }
    )
  }
}
