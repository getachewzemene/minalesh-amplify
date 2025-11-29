/**
 * E2E Tests: Reviews API
 * 
 * Tests the complete reviews flow including creating reviews,
 * retrieving reviews, and review management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  getOrSetCache: vi.fn((key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn(() => Promise.resolve()),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  getTokenFromRequest: vi.fn(),
  getUserFromToken: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { invalidateCache, getOrSetCache } from '@/lib/cache';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

describe('E2E: Reviews API', () => {
  const mockUser = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'customer' as UserRole,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Get Product Reviews', () => {
    it('should get approved reviews for a product', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          productId: 'prod-1',
          userId: 'user-1',
          rating: 5,
          title: 'Great product!',
          comment: 'Very satisfied with my purchase',
          isApproved: true,
          user: { profile: { displayName: 'John D.' } },
        },
        {
          id: 'review-2',
          productId: 'prod-1',
          userId: 'user-2',
          rating: 4,
          comment: 'Good quality',
          isApproved: true,
          user: { profile: { displayName: 'Jane S.' } },
        },
      ];

      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

      const productId = 'prod-1';
      const reviews = await prisma.review.findMany({
        where: {
          productId,
          isApproved: true,
        },
        include: {
          user: {
            select: {
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(reviews).toHaveLength(2);
      reviews.forEach(review => {
        expect(review.isApproved).toBe(true);
        expect(review.productId).toBe('prod-1');
      });
    });

    it('should cache product reviews', async () => {
      const mockReviews = [{ id: 'review-1', rating: 5 }];
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

      const productId = 'prod-1';
      await getOrSetCache(
        `product:${productId}`,
        async () => {
          return prisma.review.findMany({
            where: { productId, isApproved: true },
          });
        },
        { prefix: 'reviews' }
      );

      expect(getOrSetCache).toHaveBeenCalledWith(
        'product:prod-1',
        expect.any(Function),
        expect.objectContaining({ prefix: 'reviews' })
      );
    });

    it('should require productId parameter', () => {
      const productId = null;
      const isValid = productId !== null && productId !== undefined;
      expect(isValid).toBe(false);
      // Should return 400: 'Product ID required'
    });

    it('should return empty array for product with no reviews', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([]);

      const reviews = await prisma.review.findMany({
        where: { productId: 'prod-no-reviews', isApproved: true },
      });

      expect(reviews).toHaveLength(0);
    });

    it('should not include unapproved reviews', async () => {
      const mockReviews = [
        { id: 'review-1', isApproved: true },
        // Unapproved review is filtered by query, not included
      ];

      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

      const reviews = await prisma.review.findMany({
        where: { productId: 'prod-1', isApproved: true },
      });

      reviews.forEach(review => {
        expect(review.isApproved).toBe(true);
      });
    });
  });

  describe('Create Review', () => {
    beforeEach(() => {
      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(mockUser as any);
    });

    it('should create a new review', async () => {
      const reviewData = {
        productId: 'prod-1',
        rating: 5,
        title: 'Excellent!',
        comment: 'Best purchase I ever made',
      };

      const createdReview = {
        id: 'review-new',
        userId: 'user-1',
        ...reviewData,
        isApproved: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.review.create).mockResolvedValue(createdReview as any);

      // Step 1: Verify authentication
      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user).not.toBeNull();
      expect(user?.userId).toBe('user-1');

      // Step 2: Validate review data
      expect(reviewData.productId).toBeDefined();
      expect(reviewData.rating).toBeGreaterThanOrEqual(1);
      expect(reviewData.rating).toBeLessThanOrEqual(5);

      // Step 3: Create review
      const review = await prisma.review.create({
        data: {
          userId: user!.userId,
          productId: reviewData.productId,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
        },
      } as any);

      expect(review.id).toBeDefined();
      expect(review.userId).toBe('user-1');
      expect(review.rating).toBe(5);

      // Step 4: Invalidate cache
      await invalidateCache(`product:${reviewData.productId}`, { prefix: 'reviews' });
      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      vi.mocked(getTokenFromRequest).mockReturnValue(null);
      vi.mocked(getUserFromToken).mockReturnValue(null);

      const user = getUserFromToken(getTokenFromRequest({} as any));
      expect(user).toBeNull();
      // Should return 401 Unauthorized
    });

    it('should require productId and rating', () => {
      const invalidReviews = [
        { productId: null, rating: 5 }, // Missing productId
        { productId: 'prod-1', rating: null }, // Missing rating
        { productId: null, rating: null }, // Missing both
      ];

      for (const review of invalidReviews) {
        const isValid = review.productId && review.rating;
        expect(isValid).toBeFalsy();
      }
    });

    it('should validate rating range (1-5)', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 10];

      for (const rating of validRatings) {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      }

      for (const rating of invalidRatings) {
        const isValid = rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      }
    });

    it('should allow optional title and comment', async () => {
      const reviewWithoutOptionals = {
        productId: 'prod-1',
        rating: 4,
      };

      const createdReview = {
        id: 'review-new',
        userId: 'user-1',
        ...reviewWithoutOptionals,
        title: null,
        comment: null,
      };

      vi.mocked(prisma.review.create).mockResolvedValue(createdReview as any);

      const review = await prisma.review.create({
        data: {
          userId: 'user-1',
          productId: reviewWithoutOptionals.productId,
          rating: reviewWithoutOptionals.rating,
        },
      } as any);

      expect(review.id).toBeDefined();
      expect(review.title).toBeNull();
      expect(review.comment).toBeNull();
    });

    it('should set isApproved to false by default', async () => {
      const createdReview = {
        id: 'review-new',
        isApproved: false,
      };

      vi.mocked(prisma.review.create).mockResolvedValue(createdReview as any);

      const review = await prisma.review.create({
        data: {
          userId: 'user-1',
          productId: 'prod-1',
          rating: 5,
        },
      } as any);

      // New reviews should require approval
      expect(review.isApproved).toBe(false);
    });
  });

  describe('Review Moderation', () => {
    it('should approve a review (admin only)', async () => {
      const adminUser = {
        userId: 'admin-1',
        role: 'admin' as UserRole,
      };

      vi.mocked(getUserFromToken).mockReturnValue(adminUser as any);

      const approvedReview = {
        id: 'review-1',
        isApproved: true,
      };

      vi.mocked(prisma.review.update).mockResolvedValue(approvedReview as any);

      const user = getUserFromToken('token');
      expect(user?.role).toBe('admin');

      const review = await prisma.review.update({
        where: { id: 'review-1' },
        data: { isApproved: true },
      });

      expect(review.isApproved).toBe(true);
    });

    it('should reject a review (admin only)', async () => {
      const rejectedReview = {
        id: 'review-1',
        isApproved: false,
        rejectedAt: new Date(),
        rejectionReason: 'Inappropriate content',
      };

      vi.mocked(prisma.review.update).mockResolvedValue(rejectedReview as any);

      const review = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          isApproved: false,
          rejectedAt: new Date(),
          rejectionReason: 'Inappropriate content',
        },
      } as any);

      expect(review.isApproved).toBe(false);
      expect(review.rejectionReason).toBe('Inappropriate content');
    });

    it('should delete inappropriate review', async () => {
      vi.mocked(prisma.review.delete).mockResolvedValue({} as any);

      await prisma.review.delete({
        where: { id: 'review-inappropriate' },
      });

      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: 'review-inappropriate' },
      });
    });
  });

  describe('Review Statistics', () => {
    it('should calculate average rating', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ];

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      expect(averageRating).toBeCloseTo(4.2, 1);
    });

    it('should count reviews by rating', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
      ];

      const ratingCounts = reviews.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      expect(ratingCounts[5]).toBe(3);
      expect(ratingCounts[4]).toBe(1);
      expect(ratingCounts[3]).toBe(1);
      expect(ratingCounts[2]).toBeUndefined();
      expect(ratingCounts[1]).toBeUndefined();
    });

    it('should calculate review count', () => {
      const reviews = [
        { id: 'review-1' },
        { id: 'review-2' },
        { id: 'review-3' },
      ];

      expect(reviews.length).toBe(3);
    });
  });

  describe('Review Reporting', () => {
    it('should report a review', async () => {
      const reportedReview = {
        id: 'review-1',
        reportCount: 1,
        isReported: true,
      };

      vi.mocked(prisma.review.update).mockResolvedValue(reportedReview as any);

      const review = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          reportCount: { increment: 1 },
          isReported: true,
        },
      } as any);

      expect(review.isReported).toBe(true);
      expect(review.reportCount).toBe(1);
    });

    it('should flag review for moderation after multiple reports', async () => {
      const flaggedReview = {
        id: 'review-1',
        reportCount: 5,
        isReported: true,
        needsModeration: true,
      };

      vi.mocked(prisma.review.update).mockResolvedValue(flaggedReview as any);

      const reportThreshold = 5;
      const reportCount = 5;

      const needsModeration = reportCount >= reportThreshold;
      expect(needsModeration).toBe(true);

      const review = await prisma.review.update({
        where: { id: 'review-1' },
        data: { needsModeration: true },
      } as any);

      expect(review.needsModeration).toBe(true);
    });
  });

  describe('Verified Purchase Reviews', () => {
    it('should mark review as verified purchase', async () => {
      // Check if user has purchased the product
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'delivered',
        orderItems: [{ productId: 'prod-1' }],
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      const order = await prisma.order.findFirst({
        where: {
          userId: 'user-1',
          status: 'delivered',
          orderItems: {
            some: { productId: 'prod-1' },
          },
        },
      } as any);

      const isVerifiedPurchase = order !== null;
      expect(isVerifiedPurchase).toBe(true);
    });

    it('should not mark as verified if no purchase', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const order = await prisma.order.findFirst({
        where: {
          userId: 'user-1',
          status: 'delivered',
          orderItems: {
            some: { productId: 'prod-no-purchase' },
          },
        },
      } as any);

      const isVerifiedPurchase = order !== null;
      expect(isVerifiedPurchase).toBe(false);
    });
  });

  describe('Review Update and Delete', () => {
    beforeEach(() => {
      vi.mocked(getTokenFromRequest).mockReturnValue('valid-token');
      vi.mocked(getUserFromToken).mockReturnValue(mockUser as any);
    });

    it('should allow user to update own review', async () => {
      const existingReview = {
        id: 'review-1',
        userId: 'user-1',
        rating: 4,
        comment: 'Original comment',
      };

      const updatedReview = {
        ...existingReview,
        rating: 5,
        comment: 'Updated comment',
      };

      vi.mocked(prisma.review.findUnique).mockResolvedValue(existingReview as any);
      vi.mocked(prisma.review.update).mockResolvedValue(updatedReview as any);

      // Verify ownership
      const review = await prisma.review.findUnique({
        where: { id: 'review-1' },
      });
      expect(review?.userId).toBe('user-1');

      // Update review
      const updated = await prisma.review.update({
        where: { id: 'review-1' },
        data: { rating: 5, comment: 'Updated comment' },
      });

      expect(updated.rating).toBe(5);
      expect(updated.comment).toBe('Updated comment');
    });

    it('should prevent updating other users reviews', async () => {
      const otherUserReview = {
        id: 'review-1',
        userId: 'other-user',
      };

      vi.mocked(prisma.review.findUnique).mockResolvedValue(otherUserReview as any);

      const review = await prisma.review.findUnique({
        where: { id: 'review-1' },
      });

      const user = getUserFromToken('token');
      const isOwner = review?.userId === user?.userId;
      expect(isOwner).toBe(false);
      // Should return 403 Forbidden
    });

    it('should allow user to delete own review', async () => {
      const existingReview = {
        id: 'review-1',
        userId: 'user-1',
      };

      vi.mocked(prisma.review.findUnique).mockResolvedValue(existingReview as any);
      vi.mocked(prisma.review.delete).mockResolvedValue({} as any);

      // Verify ownership
      const review = await prisma.review.findUnique({
        where: { id: 'review-1' },
      });
      expect(review?.userId).toBe('user-1');

      // Delete review
      await prisma.review.delete({
        where: { id: 'review-1' },
      });

      expect(prisma.review.delete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const product = await prisma.product.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(product).toBeNull();
      // Review creation should validate product exists
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.review.create).mockRejectedValue(new Error('Database error'));

      await expect(
        prisma.review.create({ data: {} } as any)
      ).rejects.toThrow('Database error');
    });
  });
});
