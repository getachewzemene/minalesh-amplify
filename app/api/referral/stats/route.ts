import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getReferralStats, getUserReferrals } from '@/lib/referral'

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
 * /api/referral/stats:
 *   get:
 *     tags: [Referral]
 *     summary: Get referral statistics
 *     description: Get referral statistics and list for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [stats, referrals] = await Promise.all([
      getReferralStats(user.userId),
      getUserReferrals(user.userId),
    ])

    return NextResponse.json({
      stats,
      referrals: referrals.map((ref) => ({
        id: ref.id,
        code: ref.code,
        status: ref.status,
        createdAt: ref.createdAt,
        completedAt: ref.completedAt,
        rewardIssued: ref.rewardIssued,
        referee: ref.referee ? {
          email: ref.referee.email,
          name: ref.referee.profile
            ? `${ref.referee.profile.firstName} ${ref.referee.profile.lastName}`
            : null,
        } : null,
      })),
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics' },
      { status: 500 }
    )
  }
}
