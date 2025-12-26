import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';

/**
 * Dispute Escalation Worker
 * Auto-escalates disputes to admin review if vendor doesn't respond within 3 days
 * 
 * This endpoint should be called by a cron job every 6-12 hours
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

const VENDOR_RESPONSE_DEADLINE_HOURS = 72; // 3 days

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() - VENDOR_RESPONSE_DEADLINE_HOURS);

    // Find disputes pending vendor response that are past deadline
    const disputesToEscalate = await prisma.dispute.findMany({
      where: {
        status: 'pending_vendor_response',
        createdAt: {
          lt: deadlineDate,
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        vendor: {
          select: {
            displayName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    let escalated = 0;

    for (const dispute of disputesToEscalate) {
      try {
        // Update dispute status to pending admin review
        await prisma.dispute.update({
          where: { id: dispute.id },
          data: {
            status: 'pending_admin_review',
          },
        });

        // Add an automated message
        await prisma.disputeMessage.create({
          data: {
            disputeId: dispute.id,
            senderId: dispute.userId, // Use customer's ID for system messages
            message: 'This dispute has been automatically escalated to admin review as the vendor did not respond within 3 days.',
            isAdmin: true,
          },
        });

        // TODO: Send email notification to admin
        // TODO: Send notification to customer about escalation

        escalated++;

        logEvent('dispute_auto_escalated', {
          disputeId: dispute.id,
          orderId: dispute.orderId,
          vendorEmail: dispute.vendor.user.email,
        });
      } catch (error) {
        logError(error, {
          operation: 'escalate-dispute',
          disputeId: dispute.id,
        });
      }
    }

    const result = {
      escalated,
      total: disputesToEscalate.length,
    };

    logEvent('dispute_escalation_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'escalate-disputes-cron' });
    return NextResponse.json(
      { error: 'Failed to escalate disputes' },
      { status: 500 }
    );
  }
}

/**
 * Allow POST method as well for manual triggering
 */
export async function POST(request: Request) {
  return GET(request);
}
