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

function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = []
  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

/**
 * @swagger
 * /api/gift-cards/purchase:
 *   post:
 *     tags: [GiftCards]
 *     summary: Purchase a gift card
 *     description: Purchase a gift card for yourself or someone else
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Gift card amount in ETB
 *                 minimum: 50
 *                 maximum: 10000
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Recipient's email address
 *               message:
 *                 type: string
 *                 description: Personal message for the recipient
 *     responses:
 *       200:
 *         description: Gift card purchased successfully
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
    const { amount, recipientEmail, message } = body

    if (!amount || amount < 50 || amount > 10000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 50 and 10,000 ETB' },
        { status: 400 }
      )
    }

    // Find recipient by email if provided
    let recipientId = null
    if (recipientEmail) {
      const recipient = await prisma.user.findUnique({
        where: { email: recipientEmail },
      })
      recipientId = recipient?.id || null
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let existingCard = await prisma.giftCard.findUnique({
      where: { code },
    })
    
    while (existingCard) {
      code = generateGiftCardCode()
      existingCard = await prisma.giftCard.findUnique({
        where: { code },
      })
    }

    // Gift cards expire in 1 year
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Create gift card
    const giftCard = await prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.create({
        data: {
          code,
          purchaserId: user.userId,
          recipientId,
          recipientEmail,
          amount,
          balance: amount,
          message,
          expiresAt,
        },
      })

      // Create transaction record
      await tx.giftCardTransaction.create({
        data: {
          cardId: card.id,
          amount,
          type: 'purchase',
        },
      })

      return card
    })

    // TODO: Send email to recipient if recipientEmail is provided
    // This should be done via the email queue

    return NextResponse.json({
      id: giftCard.id,
      code: giftCard.code,
      amount: giftCard.amount,
      balance: giftCard.balance,
      expiresAt: giftCard.expiresAt,
      message: 'Gift card purchased successfully',
    })
  } catch (error) {
    console.error('Error purchasing gift card:', error)
    return NextResponse.json(
      { error: 'Failed to purchase gift card' },
      { status: 500 }
    )
  }
}
