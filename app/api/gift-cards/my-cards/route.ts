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
 * /api/gift-cards/my-cards:
 *   get:
 *     tags: [GiftCards]
 *     summary: Get user's gift cards
 *     description: Retrieve gift cards purchased by or sent to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's gift cards
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch gift cards purchased by the user
    const purchased = await prisma.giftCard.findMany({
      where: { purchaserId: user.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch gift cards received by the user
    const received = await prisma.giftCard.findMany({
      where: {
        OR: [
          { recipientId: user.userId },
          { recipientEmail: user.email },
        ],
      },
      include: {
        purchaser: {
          select: {
            email: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      purchased,
      received,
    })
  } catch (error) {
    console.error('Error fetching gift cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}
