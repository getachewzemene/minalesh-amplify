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
 * /api/gift-cards/redeem:
 *   post:
 *     tags: [GiftCards]
 *     summary: Redeem a gift card
 *     description: Redeem a gift card by code and apply balance to user account or order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Gift card code
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional order ID to apply gift card to
 *               amount:
 *                 type: number
 *                 description: Amount to redeem (partial redemption). If not provided, redeems full balance
 *     responses:
 *       200:
 *         description: Gift card redeemed successfully
 *       400:
 *         description: Invalid request or gift card
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Gift card not found
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, orderId, amount } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // Find gift card
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Validate gift card status
    if (giftCard.status !== 'active') {
      return NextResponse.json(
        { error: `Gift card is ${giftCard.status}` },
        { status: 400 }
      )
    }

    // Check expiration
    if (giftCard.expiresAt < new Date()) {
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { error: 'Gift card has expired' },
        { status: 400 }
      )
    }

    // Check if user is the recipient (if specified)
    if (giftCard.recipientId && giftCard.recipientId !== user.userId) {
      return NextResponse.json(
        { error: 'This gift card is for a different recipient' },
        { status: 403 }
      )
    }

    // Check balance
    if (Number(giftCard.balance) <= 0) {
      return NextResponse.json(
        { error: 'Gift card has no remaining balance' },
        { status: 400 }
      )
    }

    // Determine redemption amount
    const redemptionAmount = amount && amount > 0 
      ? Math.min(amount, Number(giftCard.balance))
      : Number(giftCard.balance)

    if (amount && amount > Number(giftCard.balance)) {
      return NextResponse.json(
        { error: 'Requested amount exceeds gift card balance' },
        { status: 400 }
      )
    }

    // Redeem gift card in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newBalance = Number(giftCard.balance) - redemptionAmount

      // Update gift card balance
      const updatedCard = await tx.giftCard.update({
        where: { id: giftCard.id },
        data: {
          balance: newBalance,
          status: newBalance <= 0 ? 'redeemed' : 'active',
          redeemedAt: newBalance <= 0 ? new Date() : giftCard.redeemedAt,
        },
      })

      // Create transaction record
      const transaction = await tx.giftCardTransaction.create({
        data: {
          cardId: giftCard.id,
          orderId: orderId || null,
          amount: redemptionAmount,
          type: 'redeem',
        },
      })

      return { card: updatedCard, transaction }
    })

    return NextResponse.json({
      message: 'Gift card redeemed successfully',
      redemptionAmount,
      remainingBalance: Number(result.card.balance),
      status: result.card.status,
    })
  } catch (error) {
    console.error('Error redeeming gift card:', error)
    return NextResponse.json(
      { error: 'Failed to redeem gift card' },
      { status: 500 }
    )
  }
}
