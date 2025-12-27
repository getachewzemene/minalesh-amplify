import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/disputes/{id}:
 *   patch:
 *     summary: Resolve dispute
 *     description: Admin resolution of a dispute (admin only)
 *     tags: [Admin, Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - resolution
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [resolved, closed]
 *               resolution:
 *                 type: string
 *                 description: Details of the resolution
 *               refundAmount:
 *                 type: number
 *                 description: Amount to refund (if applicable)
 *     responses:
 *       200:
 *         description: Dispute resolved
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Dispute not found
 */

async function resolveDisputeHandler(
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
    const { status, resolution, refundAmount } = body;

    if (!status || !resolution) {
      return NextResponse.json(
        { error: 'Status and resolution are required' },
        { status: 400 }
      );
    }

    if (!['resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be resolved or closed' },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedBy: user.userId,
        resolvedAt: new Date(),
      },
    });

    // If refund is requested, create a refund
    if (refundAmount && refundAmount > 0) {
      await prisma.refund.create({
        data: {
          orderId: dispute.orderId,
          amount: refundAmount,
          reason: `Dispute resolution: ${resolution}`,
          status: 'pending',
        },
      });

      // TODO: Process the actual refund through payment provider
    }

    // Send email notifications to customer and vendor
    const [customerProfile, vendorProfile, orderInfo] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: dispute.userId },
        select: {
          displayName: true,
          user: { select: { email: true } },
        },
      }),
      prisma.profile.findUnique({
        where: { id: dispute.vendorId },
        select: {
          displayName: true,
          user: { select: { email: true } },
        },
      }),
      prisma.order.findUnique({
        where: { id: dispute.orderId },
        select: { orderNumber: true },
      }),
    ]);

    if (customerProfile && vendorProfile && orderInfo) {
      const { queueEmail, createDisputeResolvedEmail } = await import('@/lib/email');
      
      // Determine outcome based on resolution text and refund
      let outcome: 'customer_favor' | 'vendor_favor' | 'partial_refund' | 'other' = 'other';
      if (refundAmount && refundAmount > 0) {
        if (refundAmount >= dispute.order.totalAmount) {
          outcome = 'customer_favor';
        } else {
          outcome = 'partial_refund';
        }
      } else if (resolution.toLowerCase().includes('customer') || resolution.toLowerCase().includes('buyer')) {
        outcome = 'customer_favor';
      } else if (resolution.toLowerCase().includes('vendor') || resolution.toLowerCase().includes('seller')) {
        outcome = 'vendor_favor';
      }

      // Notify customer
      const customerEmail = createDisputeResolvedEmail(
        customerProfile.user.email,
        customerProfile.displayName || 'Customer',
        dispute.id,
        orderInfo.orderNumber,
        resolution,
        outcome
      );
      await queueEmail(customerEmail);

      // Notify vendor
      const vendorEmail = createDisputeResolvedEmail(
        vendorProfile.user.email,
        vendorProfile.displayName || 'Vendor',
        dispute.id,
        orderInfo.orderNumber,
        resolution,
        outcome
      );
      await queueEmail(vendorEmail);
    }

    return NextResponse.json({
      message: 'Dispute resolved successfully',
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    throw error;
  }
}

export const PATCH = withApiLogger(
  withRoleCheck(resolveDisputeHandler, ['admin'])
);
