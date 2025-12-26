import prisma from '@/lib/prisma'

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000,
}

// Points earning rates
export const POINTS_RATES = {
  purchase: 1, // 1 point per 10 ETB spent
  review: 50, // 50 points for writing a review
  referralReferrer: 100, // 100 points for successful referral
  referralReferee: 50, // 50 points for being referred
  bonus: 0, // Variable bonus points
}

export function calculateTier(lifetimePoints: number): {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  nextTierPoints: number
} {
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

export function calculatePointsFromAmount(amount: number): number {
  // 1 point per 10 ETB
  return Math.floor(amount / 10)
}

export async function awardPoints(
  userId: string,
  points: number,
  type: string,
  description: string,
  relatedId?: string,
  expiresAt?: Date
) {
  try {
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
          expiresAt,
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
          tier,
          nextTierPoints,
        },
      })

      return { transaction, account: updatedAccount }
    })

    return result
  } catch (error) {
    console.error('Error awarding loyalty points:', error)
    throw error
  }
}

export async function redeemPoints(
  userId: string,
  points: number,
  description: string,
  relatedId?: string
) {
  try {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    })

    if (!account) {
      throw new Error('Loyalty account not found')
    }

    if (account.points < points) {
      throw new Error('Insufficient points')
    }

    return await awardPoints(
      userId,
      -points,
      'redeem',
      description,
      relatedId
    )
  } catch (error) {
    console.error('Error redeeming loyalty points:', error)
    throw error
  }
}

export async function getTierBenefits(tier: string): Promise<{
  discountPercentage: number
  freeShipping: boolean
  prioritySupport: boolean
  extendedReturns: number
  pointsMultiplier: number
}> {
  switch (tier) {
    case 'platinum':
      return {
        discountPercentage: 10,
        freeShipping: true,
        prioritySupport: true,
        extendedReturns: 30,
        pointsMultiplier: 2,
      }
    case 'gold':
      return {
        discountPercentage: 7,
        freeShipping: true,
        prioritySupport: true,
        extendedReturns: 21,
        pointsMultiplier: 1.5,
      }
    case 'silver':
      return {
        discountPercentage: 5,
        freeShipping: false,
        prioritySupport: false,
        extendedReturns: 14,
        pointsMultiplier: 1.25,
      }
    case 'bronze':
    default:
      return {
        discountPercentage: 0,
        freeShipping: false,
        prioritySupport: false,
        extendedReturns: 7,
        pointsMultiplier: 1,
      }
  }
}
