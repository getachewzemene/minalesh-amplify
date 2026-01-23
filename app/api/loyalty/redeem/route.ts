import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { calculateRedemptionValue, getOrCreateLoyaltyAccount } from '@/services/LoyaltyService'

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
 * /api/loyalty/redeem:
 *   post:
 *     tags: [Loyalty]
 *     summary: Calculate redemption value
 *     description: Calculate how much discount can be obtained from redeeming points
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Number of points to redeem
 *     responses:
 *       200:
 *         description: Redemption value calculated successfully
 *       400:
 *         description: Invalid request
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
    const { points } = body

    if (!points || points <= 0) {
      return NextResponse.json(
        { error: 'Invalid points amount' },
        { status: 400 }
      )
    }

    // Get user's loyalty account
    const account = await getOrCreateLoyaltyAccount(user.userId)

    if (account.points < points) {
      return NextResponse.json(
        { error: 'Insufficient points', available: account.points },
        { status: 400 }
      )
    }

    // Calculate redemption value
    const discountAmount = calculateRedemptionValue(points)

    return NextResponse.json({
      points,
      discountAmount,
      available: account.points,
    })
  } catch (error) {
    console.error('Error calculating redemption:', error)
    return NextResponse.json(
      { error: 'Failed to calculate redemption' },
      { status: 500 }
    )
  }
}
