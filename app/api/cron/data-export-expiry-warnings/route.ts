import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';
import { queueEmail, createDataExportExpiringEmail } from '@/lib/email';

/**
 * Data Export Expiry Warning Worker
 * Sends email warnings for data exports that will expire soon
 * 
 * This endpoint should be called by a cron job every 24 hours
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

const WARNING_HOURS_BEFORE_EXPIRY = 24; // Send warning 24 hours before expiry

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

    const now = new Date();
    const warningThreshold = new Date();
    warningThreshold.setHours(warningThreshold.getHours() + WARNING_HOURS_BEFORE_EXPIRY);

    // Find completed exports that will expire within the warning period
    // and haven't had a warning sent yet
    const exportsNearExpiry = await prisma.dataExportRequest.findMany({
      where: {
        status: 'completed',
        expiresAt: {
          gt: now,
          lte: warningThreshold,
        },
        // Only send warning once - check if we've already sent one
        // We'll use metadata field to track this
        NOT: {
          metadata: {
            path: ['expiryWarningSent'],
            equals: true,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    let warningsSent = 0;

    for (const exportRequest of exportsNearExpiry) {
      try {
        if (!exportRequest.user || !exportRequest.downloadUrl) {
          continue;
        }

        // Calculate hours remaining
        const hoursRemaining = Math.ceil(
          (exportRequest.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        // Send expiry warning email
        const emailTemplate = createDataExportExpiringEmail(
          exportRequest.user.email,
          exportRequest.downloadUrl,
          exportRequest.expiresAt,
          hoursRemaining
        );

        await queueEmail(emailTemplate);

        // Mark that we've sent the warning
        await prisma.dataExportRequest.update({
          where: { id: exportRequest.id },
          data: {
            metadata: {
              ...(exportRequest.metadata as object || {}),
              expiryWarningSent: true,
              expiryWarningSentAt: new Date().toISOString(),
            },
          },
        });

        warningsSent++;

        logEvent('data_export_expiry_warning_sent', {
          requestId: exportRequest.id,
          userId: exportRequest.userId,
          hoursRemaining,
        });
      } catch (error) {
        logError(error, {
          operation: 'send-data-export-expiry-warning',
          requestId: exportRequest.id,
        });
      }
    }

    const result = {
      warningsSent,
      total: exportsNearExpiry.length,
    };

    logEvent('data_export_expiry_warnings_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'data-export-expiry-warnings-cron' });
    return NextResponse.json(
      { error: 'Failed to send expiry warnings' },
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
