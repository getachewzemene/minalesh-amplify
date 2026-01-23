/**
 * Loyalty Service
 * 
 * Handles loyalty program business logic including points earning,
 * tier upgrades, and redemption.
 */

import prisma from '@/lib/prisma';

// Tier thresholds based on lifetime points
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
} as const;

// Points earning rate per tier (points per 10 ETB spent)
export const TIER_EARNING_RATES = {
  bronze: 1,
  silver: 1.5,
  gold: 2,
  platinum: 3,
} as const;

// Redemption rate: 100 points = 10 ETB
export const POINTS_TO_CURRENCY_RATE = 0.1; // 1 point = 0.1 ETB

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface TierInfo {
  tier: LoyaltyTier;
  nextTierPoints: number;
}

/**
 * Calculate tier based on lifetime points
 */
export function calculateTier(lifetimePoints: number): TierInfo {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) {
    return { tier: 'platinum', nextTierPoints: 0 };
  } else if (lifetimePoints >= TIER_THRESHOLDS.gold) {
    return { tier: 'gold', nextTierPoints: TIER_THRESHOLDS.platinum };
  } else if (lifetimePoints >= TIER_THRESHOLDS.silver) {
    return { tier: 'silver', nextTierPoints: TIER_THRESHOLDS.gold };
  } else {
    return { tier: 'bronze', nextTierPoints: TIER_THRESHOLDS.silver };
  }
}

/**
 * Calculate points earned from a purchase amount
 */
export function calculatePointsFromPurchase(amount: number, tier: LoyaltyTier): number {
  const rate = TIER_EARNING_RATES[tier];
  // Points earned = (amount / 10) * rate
  // For example: 100 ETB at bronze tier = (100/10) * 1 = 10 points
  return Math.floor((amount / 10) * rate);
}

/**
 * Calculate discount amount from points redemption
 */
export function calculateRedemptionValue(points: number): number {
  return points * POINTS_TO_CURRENCY_RATE;
}

/**
 * Get or create loyalty account for a user
 */
export async function getOrCreateLoyaltyAccount(userId: string) {
  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: {
        userId,
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        nextTierPoints: TIER_THRESHOLDS.silver,
      },
    });
  }

  return account;
}

/**
 * Award points to a user's loyalty account
 */
export async function awardPoints(
  userId: string,
  points: number,
  type: string,
  description: string,
  relatedId?: string,
  expiresAt?: Date
) {
  const account = await getOrCreateLoyaltyAccount(userId);

  const result = await prisma.$transaction(async (tx) => {
    // Create transaction record
    const transaction = await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        points,
        type,
        description,
        relatedId,
        expiresAt,
      },
    });

    // Update account points and check for tier upgrade
    const newPoints = account.points + points;
    const newLifetimePoints = points > 0 ? account.lifetimePoints + points : account.lifetimePoints;
    
    const { tier, nextTierPoints } = calculateTier(newLifetimePoints);

    const updatedAccount = await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: Math.max(0, newPoints),
        lifetimePoints: newLifetimePoints,
        tier,
        nextTierPoints,
      },
    });

    return { transaction, account: updatedAccount, tierUpgraded: tier !== account.tier };
  });

  return result;
}

/**
 * Redeem points for a discount
 */
export async function redeemPoints(
  userId: string,
  pointsToRedeem: number,
  description: string,
  relatedId?: string
) {
  const account = await getOrCreateLoyaltyAccount(userId);

  if (account.points < pointsToRedeem) {
    throw new Error('Insufficient points');
  }

  // Redeem points (negative transaction)
  const result = await awardPoints(
    userId,
    -pointsToRedeem,
    'redeem',
    description,
    relatedId
  );

  const discountAmount = calculateRedemptionValue(pointsToRedeem);

  return {
    ...result,
    discountAmount,
  };
}

/**
 * Award points for a completed purchase
 */
export async function awardPointsForPurchase(
  userId: string,
  orderId: string,
  orderAmount: number
) {
  const account = await getOrCreateLoyaltyAccount(userId);
  const pointsEarned = calculatePointsFromPurchase(orderAmount, account.tier);

  const result = await awardPoints(
    userId,
    pointsEarned,
    'purchase',
    `Purchase order #${orderId.slice(0, 8)}`,
    orderId
  );

  return {
    ...result,
    pointsEarned,
  };
}
