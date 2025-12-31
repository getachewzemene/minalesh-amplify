import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

/**
 * @swagger
 * /api/loyalty/transactions:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty transaction history
 *     description: Retrieve the current user's loyalty point transaction history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create loyalty account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId: payload.userId },
    })

    if (!account) {
      // Create account if it doesn't exist
      account = await prisma.loyaltyAccount.create({
        data: {
          userId: payload.userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
          nextTierPoints: 1000,
        },
      })
    }

    // Get pagination parameters
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')
    const skip = (page - 1) * perPage

    // Fetch transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    })

    // Get total count for pagination
    const total = await prisma.loyaltyTransaction.count({
      where: { accountId: account.id },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transactions' },
      { status: 500 }
    )
  }
}
