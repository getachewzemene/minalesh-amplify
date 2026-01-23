import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkAndCompleteReferral, getReferralStats, getUserReferrals } from '@/lib/referral'
import prisma from '@/lib/prisma'

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  default: {
    referral: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock the loyalty points module
vi.mock('@/lib/loyalty/points', () => ({
  awardPoints: vi.fn(),
  POINTS_RATES: {
    referralReferrer: 100,
    referralReferee: 50,
  },
}))

describe('Referral System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAndCompleteReferral', () => {
    it('should do nothing if no referral exists for user', async () => {
      vi.mocked(prisma.referral.findFirst).mockResolvedValue(null)

      await checkAndCompleteReferral('user-123', 'order-456')

      expect(prisma.referral.findFirst).toHaveBeenCalledWith({
        where: {
          refereeId: 'user-123',
          status: { in: ['pending', 'registered'] },
          rewardIssued: false,
        },
      })
      expect(prisma.order.count).not.toHaveBeenCalled()
    })

    it('should complete referral on first order', async () => {
      const mockReferral = {
        id: 'referral-123',
        referrerId: 'referrer-456',
        refereeId: 'user-123',
        status: 'registered',
        rewardIssued: false,
      }

      vi.mocked(prisma.referral.findFirst).mockResolvedValue(mockReferral as any)
      vi.mocked(prisma.order.count).mockResolvedValue(1)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(prisma)
      })
      vi.mocked(prisma.referral.update).mockResolvedValue(mockReferral as any)

      await checkAndCompleteReferral('user-123', 'order-456')

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] },
        },
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should not complete referral if not first order', async () => {
      const mockReferral = {
        id: 'referral-123',
        referrerId: 'referrer-456',
        refereeId: 'user-123',
        status: 'registered',
        rewardIssued: false,
      }

      vi.mocked(prisma.referral.findFirst).mockResolvedValue(mockReferral as any)
      vi.mocked(prisma.order.count).mockResolvedValue(3) // More than one order

      await checkAndCompleteReferral('user-123', 'order-456')

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('getReferralStats', () => {
    it('should return correct stats', async () => {
      vi.mocked(prisma.referral.count).mockResolvedValueOnce(10) // total
      vi.mocked(prisma.referral.count).mockResolvedValueOnce(3) // registered
      vi.mocked(prisma.referral.count).mockResolvedValueOnce(5) // completed
      vi.mocked(prisma.referral.count).mockResolvedValueOnce(5) // rewards issued

      const stats = await getReferralStats('user-123')

      expect(stats).toEqual({
        totalReferrals: 10,
        registeredReferrals: 3,
        completedReferrals: 5,
        totalRewards: 500, // 5 * 100 points
        pendingReferrals: 2, // 10 - 3 - 5
      })
    })
  })

  describe('getUserReferrals', () => {
    it('should return list of referrals', async () => {
      const mockReferrals = [
        {
          id: 'ref-1',
          code: 'ABC123',
          status: 'completed',
          createdAt: new Date(),
          referee: {
            email: 'user@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      ]

      vi.mocked(prisma.referral.findMany).mockResolvedValue(mockReferrals as any)

      const referrals = await getUserReferrals('user-123')

      expect(referrals).toEqual(mockReferrals)
      expect(prisma.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'user-123' },
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
    })
  })
})
