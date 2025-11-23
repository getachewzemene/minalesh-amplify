import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

const REPORT_THRESHOLD = 3; // Number of reports needed to trigger action
const BAD_REVIEW_THRESHOLD = 2; // Reviews with rating <= 2 are considered "bad"

/**
 * @swagger
 * /api/reviews/{reviewId}/report:
 *   post:
 *     summary: Report a review
 *     description: Report a review as inappropriate or problematic
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reporting the review
 *     responses:
 *       200:
 *         description: Review reported successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    const { reviewId } = params;

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this review
    const reportedBy = (review.reportedBy as string[]) || [];
    if (reportedBy.includes(payload.userId)) {
      return NextResponse.json(
        { error: 'You have already reported this review' },
        { status: 400 }
      );
    }

    // Update the review with the new report
    const updatedReportedBy = [...reportedBy, payload.userId];
    const newReportCount = review.reportCount + 1;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reportCount: newReportCount,
        reportedBy: updatedReportedBy,
      },
    });

    // Check if the review meets the criteria for action
    // (bad review with multiple reports)
    const isBadReview = review.rating <= BAD_REVIEW_THRESHOLD;
    const hasEnoughReports = newReportCount >= REPORT_THRESHOLD;

    if (isBadReview && hasEnoughReports) {
      // Suspend the vendor
      await prisma.profile.update({
        where: { id: review.product.vendorId },
        data: {
          vendorStatus: 'suspended',
        },
      });

      // Deactivate the product
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          isActive: false,
        },
      });

      // Create a notification for the vendor
      const suspensionMessage = `Your vendor account has been suspended due to multiple reports (${newReportCount}) on a low-rated review (${review.rating} stars) for product "${review.product.name}". The review received reports citing: "${reason}". This action was taken to maintain the quality and integrity of our marketplace. Please contact support to appeal this decision.`;

      await prisma.notification.create({
        data: {
          userId: review.product.vendorId,
          type: 'vendor',
          title: 'Vendor Account Suspended',
          message: suspensionMessage,
          data: {
            reviewId: review.id,
            productId: review.productId,
            reportCount: newReportCount,
            rating: review.rating,
            reason,
          },
        },
      });

      return NextResponse.json({
        message: 'Review reported successfully. Vendor has been suspended and product has been deactivated due to multiple reports on a bad review.',
        review: updatedReview,
        actionTaken: true,
        suspensionMessage,
      });
    }

    return NextResponse.json({
      message: 'Review reported successfully',
      review: updatedReview,
      actionTaken: false,
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'An error occurred while reporting the review' },
      { status: 500 }
    );
  }
}
