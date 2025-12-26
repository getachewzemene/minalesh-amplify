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

function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

/**
 * @swagger
 * /api/referral/code:
 *   get:
 *     tags: [Referral]
 *     summary: Get referral code
 *     description: Get or create a referral code for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral code retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find existing active referral code
    let referral = await prisma.referral.findFirst({
      where: {
        referrerId: user.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Create new referral code if none exists or all expired
    if (!referral) {
      let code = generateReferralCode()
      
      // Ensure code is unique
      let existingCode = await prisma.referral.findUnique({
        where: { code },
      })
      
      while (existingCode) {
        code = generateReferralCode()
        existingCode = await prisma.referral.findUnique({
          where: { code },
        })
      }

      // Create referral code (valid for 1 year)
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      referral = await prisma.referral.create({
        data: {
          referrerId: user.userId,
          code,
          expiresAt,
        },
      })
    }

    // Get referral stats
    const stats = await prisma.referral.aggregate({
      where: {
        referrerId: user.userId,
        status: { in: ['registered', 'completed'] },
      },
      _count: true,
    })

    const completedCount = await prisma.referral.count({
      where: {
        referrerId: user.userId,
        status: 'completed',
      },
    })

    return NextResponse.json({
      code: referral.code,
      expiresAt: referral.expiresAt,
      totalReferrals: stats._count || 0,
      completedReferrals: completedCount,
    })
  } catch (error) {
    console.error('Error fetching referral code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral code' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/referral/code:
 *   post:
 *     tags: [Referral]
 *     summary: Create new referral code
 *     description: Generate a new referral code (invalidates old ones)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New referral code created successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique code
    let code = generateReferralCode()
    let existingCode = await prisma.referral.findUnique({
      where: { code },
    })
    
    let attempts = 0
    const MAX_ATTEMPTS = 10
    
    while (existingCode && attempts < MAX_ATTEMPTS) {
      code = generateReferralCode()
      existingCode = await prisma.referral.findUnique({
        where: { code },
      })
      attempts++
    }
    
    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code. Please try again.' },
        { status: 500 }
      )
    }

    // Create new referral code (valid for 1 year)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const referral = await prisma.referral.create({
      data: {
        referrerId: user.userId,
        code,
        expiresAt,
      },
    })

    return NextResponse.json({
      code: referral.code,
      expiresAt: referral.expiresAt,
    })
  } catch (error) {
    console.error('Error creating referral code:', error)
    return NextResponse.json(
      { error: 'Failed to create referral code' },
      { status: 500 }
    )
  }
}
