import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { processAutoRefund } from '@/lib/payment-refund';

/**
 * @swagger
 * /api/admin/disputes/{id}/refund:
 *   post:
 *     summary: Process auto-refund for a dispute
 *     description: Automatically process refund through payment provider (admin only)
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
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Refund amount (optional, defaults to order total)
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid request or refund already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Dispute not found
 */

async function processRefundHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: disputeId } = params;
    const body = await request.json();
    const customAmount = body.amount;

    // Get dispute with order details
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
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

    // Check if refund already processed
    if (dispute.refundProcessed) {
      return NextResponse.json(
        { error: 'Refund already processed for this dispute' },
        { status: 400 }
      );
    }

    // Get payment details from order
    const order = dispute.order;
    if (!order.paymentMethod || !order.paymentReference) {
      return NextResponse.json(
        { error: 'No payment information found for this order' },
        { status: 400 }
      );
    }

    if (order.paymentStatus === 'refunded') {
      return NextResponse.json(
        { error: 'Order has already been refunded' },
        { status: 400 }
      );
    }

    // Determine refund amount
    const refundAmount = customAmount ?? Number(order.totalAmount);

    if (refundAmount > Number(order.totalAmount)) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      );
    }

    // Process refund through payment provider
    const refundResult = await processAutoRefund(
      dispute.orderId,
      refundAmount,
      order.paymentMethod || 'stripe',
      order.paymentReference || order.stripeSessionId || order.id
    );

    if (!refundResult.success) {
      // Update dispute with refund failure
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          refundProcessed: false,
          refundAmount,
        },
      });

      return NextResponse.json(
        { 
          error: 'Failed to process refund',
          details: refundResult.error,
        },
        { status: 500 }
      );
    }

    // Update dispute and order records
    await Promise.all([
      prisma.dispute.update({
        where: { id: disputeId },
        data: {
          refundProcessed: true,
          refundAmount,
          refundTransactionId: refundResult.refundId,
        },
      }),
      // Update order status
      prisma.order.update({
        where: { id: dispute.orderId },
        data: {
          status: 'refunded',
          paymentStatus: 'refunded',
          refundedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      refundId: refundResult.refundId,
      amount: refundAmount,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

export const POST = withApiLogger(
  withRoleCheck(processRefundHandler, ['admin'])
);
