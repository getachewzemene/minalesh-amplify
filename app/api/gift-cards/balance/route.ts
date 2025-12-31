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
 * /api/gift-cards/balance:
 *   get:
 *     tags: [GiftCards]
 *     summary: Check gift card balance
 *     description: Check the balance of a gift card by code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Gift card code
 *     responses:
 *       200:
 *         description: Gift card balance retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Gift card not found
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      )
    }

    // Find gift card
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Check expiration and update status if needed
    let currentStatus = giftCard.status
    if (giftCard.expiresAt < new Date() && giftCard.status === 'active') {
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { status: 'expired' },
      })
      currentStatus = 'expired'
    }

    return NextResponse.json({
      code: giftCard.code,
      balance: Number(giftCard.balance),
      originalAmount: Number(giftCard.amount),
      status: currentStatus,
      expiresAt: giftCard.expiresAt,
      isExpired: giftCard.expiresAt < new Date(),
      recipientEmail: giftCard.recipientEmail,
      message: giftCard.message,
      transactions: giftCard.transactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        createdAt: t.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error checking gift card balance:', error)
    return NextResponse.json(
      { error: 'Failed to check gift card balance' },
      { status: 500 }
    )
  }
}
