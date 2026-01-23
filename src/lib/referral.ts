import prisma from '@/lib/prisma'
import { awardPoints, POINTS_RATES } from '@/lib/loyalty/points'

/**
 * Check if a referral should be marked as completed and issue rewards
 * This should be called when a user makes their first order
 */
export async function checkAndCompleteReferral(userId: string, orderId: string): Promise<void> {
  try {
    // Find pending or registered referral where this user is the referee
    // Only find referrals that haven't been rewarded yet to prevent double completion
    const referral = await prisma.referral.findFirst({
      where: {
        refereeId: userId,
        status: { in: ['pending', 'registered'] },
        rewardIssued: false,
      },
    })

    if (!referral) {
      // No pending referral found
      return
    }

    // Check if this is the user's first completed order
    const completedOrdersCount = await prisma.order.count({
      where: {
        userId,
        status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] },
      },
    })

    // If this is their first completed order, complete the referral
    if (completedOrdersCount === 1) {
      // Update referral status in transaction
      // Note: rewardIssued is set to true here to prevent race conditions
      await prisma.$transaction(async (tx) => {
        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            rewardIssued: true,
          },
        })
      })

      // Award points to the referrer outside transaction to avoid nested transactions
      try {
        await awardPoints(
          referral.referrerId,
          POINTS_RATES.referralReferrer, // 100 points
          'referral',
          'Reward for successful referral',
          referral.id
        )
      } catch (error) {
        console.error('Error awarding points to referrer:', error)
        // Continue even if points award fails
      }
    }
  } catch (error) {
    console.error('Error checking and completing referral:', error)
    // Don't throw error to avoid breaking order processing
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string) {
  try {
    const [totalReferrals, registeredReferrals, completedReferrals, totalRewards] = await Promise.all([
      // Total referrals (all statuses)
      prisma.referral.count({
        where: { referrerId: userId },
      }),
      
      // Registered referrals (signed up but not purchased)
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'registered',
        },
      }),
      
      // Completed referrals (made first purchase)
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'completed',
        },
      }),
      
      // Total rewards earned (100 points per completed referral)
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'completed',
          rewardIssued: true,
        },
      }),
    ])

    return {
      totalReferrals,
      registeredReferrals,
      completedReferrals,
      totalRewards: totalRewards * POINTS_RATES.referralReferrer,
      pendingReferrals: totalReferrals - registeredReferrals - completedReferrals,
    }
  } catch (error) {
    console.error('Error getting referral stats:', error)
    throw error
  }
}

/**
 * Get detailed referral list for a user
 */
export async function getUserReferrals(userId: string) {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return referrals
  } catch (error) {
    console.error('Error getting user referrals:', error)
    throw error
  }
}
