import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/disputes/{id}/messages:
 *   post:
 *     summary: Add message to dispute
 *     description: Send a message in a dispute thread
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
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dispute not found
 *   get:
 *     summary: Get dispute messages
 *     description: Retrieve all messages in a dispute thread
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
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dispute not found
 */

async function sendMessageHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: disputeId } = params;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
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
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this dispute' },
        { status: 403 }
      );
    }

    // Check if dispute is closed
    if (dispute.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot send messages to a closed dispute' },
        { status: 400 }
      );
    }

    // Create message
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: user.userId,
        message: message.trim(),
        isAdmin: user.role === 'admin',
      },
    });

    // Update dispute status if vendor responds
    if (isVendor && dispute.status === 'pending_vendor_response') {
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { status: 'open' },
      });
    }

    // Send email notification to other party
    const senderProfile = await prisma.profile.findUnique({
      where: { userId: user.userId },
      select: {
        displayName: true,
        user: { select: { email: true } },
      },
    });

    // Get recipient info
    let recipientEmail: string | null = null;
    let recipientName: string | null = null;

    if (isCustomer || isAdmin) {
      // Notify vendor
      const vendorProfile = await prisma.profile.findUnique({
        where: { id: dispute.vendorId },
        select: {
          displayName: true,
          user: { select: { email: true } },
        },
      });
      if (vendorProfile) {
        recipientEmail = vendorProfile.user.email;
        recipientName = vendorProfile.displayName || 'Vendor';
      }
    } else if (isVendor) {
      // Notify customer
      const customerProfile = await prisma.profile.findUnique({
        where: { userId: dispute.userId },
        select: {
          displayName: true,
          user: { select: { email: true } },
        },
      });
      if (customerProfile) {
        recipientEmail = customerProfile.user.email;
        recipientName = customerProfile.displayName || 'Customer';
      }
    }

    if (recipientEmail && recipientName && senderProfile) {
      const orderInfo = await prisma.order.findUnique({
        where: { id: dispute.orderId },
        select: { orderNumber: true },
      });

      if (orderInfo) {
        const { queueEmail, createDisputeRespondedEmail } = await import('@/lib/email');
        const senderName = senderProfile.displayName || (isAdmin ? 'Admin' : 'User');
        const emailTemplate = createDisputeRespondedEmail(
          recipientEmail,
          recipientName,
          disputeId,
          orderInfo.orderNumber,
          senderName
        );
        await queueEmail(emailTemplate);
      }
    }

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        disputeMessage: {
          id: disputeMessage.id,
          message: disputeMessage.message,
          createdAt: disputeMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending dispute message:', error);
    throw error;
  }
}

async function getMessagesHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: disputeId } = params;

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
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
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have access to this dispute' },
        { status: 403 }
      );
    }

    const messages = await prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        message: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching dispute messages:', error);
    throw error;
  }
}

export const POST = withApiLogger(sendMessageHandler);
export const GET = withApiLogger(getMessagesHandler);
