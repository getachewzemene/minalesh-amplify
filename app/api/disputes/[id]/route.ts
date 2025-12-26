import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/disputes/{id}:
 *   get:
 *     summary: Get dispute details
 *     description: Retrieve detailed information about a specific dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: Dispute details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not your dispute
 *       404:
 *         description: Dispute not found
 *   patch:
 *     summary: Update dispute status
 *     description: Update dispute status (vendor or customer)
 *     tags: [Disputes]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, pending_admin_review, resolved, closed]
 *               resolution:
 *                 type: string
 *                 description: Resolution details if resolving
 *     responses:
 *       200:
 *         description: Dispute updated
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dispute not found
 */

async function getDisputeHandler(
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

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        vendor: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            senderId: true,
            message: true,
            isAdmin: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check access: must be customer, vendor, or admin
    const isCustomer = dispute.userId === user.userId;
    const isVendor = profile?.isVendor && dispute.vendorId === profile.id;
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this dispute' },
        { status: 403 }
      );
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    throw error;
  }
}

async function updateDisputeHandler(
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
    const { status, resolution } = body;

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    const dispute = await prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check access
    const isCustomer = dispute.userId === user.userId;
    const isVendor = profile?.isVendor && dispute.vendorId === profile.id;

    if (!isCustomer && !isVendor) {
      return NextResponse.json(
        { error: 'You do not have permission to update this dispute' },
        { status: 403 }
      );
    }

    // Vendors can escalate to admin review
    if (isVendor && status === 'pending_admin_review') {
      const updated = await prisma.dispute.update({
        where: { id },
        data: { status: 'pending_admin_review' },
      });

      // TODO: Send notification to admin

      return NextResponse.json({
        message: 'Dispute escalated to admin review',
        dispute: updated,
      });
    }

    // Customers can only close their own disputes
    if (isCustomer && status === 'closed') {
      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          status: 'closed',
          resolution: resolution || 'Closed by customer',
        },
      });

      return NextResponse.json({
        message: 'Dispute closed',
        dispute: updated,
      });
    }

    return NextResponse.json(
      { error: 'Invalid status update' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating dispute:', error);
    throw error;
  }
}

export const GET = withApiLogger(getDisputeHandler);
export const PATCH = withApiLogger(updateDisputeHandler);
