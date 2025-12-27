import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/vendors/verification/{id}:
 *   get:
 *     summary: Get vendor verification details
 *     description: Retrieve detailed verification information (admin only)
 *     tags: [Admin, Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID
 *     responses:
 *       200:
 *         description: Verification details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Verification not found
 *   patch:
 *     summary: Review vendor verification
 *     description: Approve, reject, or update verification status (admin only)
 *     tags: [Admin, Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [under_review, approved, rejected, suspended]
 *               rejectionReason:
 *                 type: string
 *                 description: Required if status is rejected
 *     responses:
 *       200:
 *         description: Verification status updated
 *       400:
 *         description: Invalid status or missing rejection reason
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Verification not found
 */

async function getVerificationHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    const verification = await prisma.vendorVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Get vendor profile separately
    const vendor = await prisma.profile.findUnique({
      where: { id: verification.vendorId },
      select: {
        id: true,
        displayName: true,
        tradeLicense: true,
        tinNumber: true,
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      verification: {
        ...verification,
        vendor,
      },
    });
  } catch (error) {
    console.error('Error fetching verification:', error);
    throw error;
  }
}

async function reviewVerificationHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    // Validate status
    const validStatuses = ['under_review', 'approved', 'rejected', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Rejection reason is required for rejected status
    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a verification' },
        { status: 400 }
      );
    }

    // Check if verification exists
    const verification = await prisma.vendorVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Get vendor profile with user email
    const vendor = await prisma.profile.findUnique({
      where: { id: verification.vendorId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Update verification status
    const updatedVerification = await prisma.vendorVerification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        reviewedBy: user.userId,
        reviewedAt: new Date(),
      },
    });

    // Update vendor status in profile if approved
    if (status === 'approved') {
      await prisma.profile.update({
        where: { id: verification.vendorId },
        data: {
          vendorStatus: 'approved',
        },
      });
    } else if (status === 'rejected' || status === 'suspended') {
      await prisma.profile.update({
        where: { id: verification.vendorId },
        data: {
          vendorStatus: status as any,
        },
      });
    }

    // Send email notification to vendor about verification decision
    if (vendor?.user?.email) {
      const { queueEmail, createVerificationStatusEmail } = await import('@/lib/email');
      const vendorName = vendor.displayName || vendor.user.email.split('@')[0];
      const emailTemplate = createVerificationStatusEmail(
        vendor.user.email,
        vendorName,
        status,
        rejectionReason
      );
      await queueEmail(emailTemplate);
    }

    return NextResponse.json({
      message: `Verification ${status} successfully`,
      verification: updatedVerification,
    });
  } catch (error) {
    console.error('Error reviewing verification:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(getVerificationHandler, ['admin'])
);
export const PATCH = withApiLogger(
  withRoleCheck(reviewVerificationHandler, ['admin'])
);
