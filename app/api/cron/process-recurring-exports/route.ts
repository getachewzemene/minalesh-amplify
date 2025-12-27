import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';

/**
 * Recurring Data Exports Cron Job
 * Processes recurring export requests that are due
 * 
 * This endpoint should be called by a cron job daily
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

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

    // Find recurring exports that are due
    const dueExports = await prisma.dataExportRequest.findMany({
      where: {
        isRecurring: true,
        status: 'pending',
        nextRunAt: {
          lte: now,
        },
      },
      take: 10, // Process up to 10 at a time
    });

    let processed = 0;

    for (const exportRequest of dueExports) {
      try {
        // Update status to processing to prevent duplicate processing
        await prisma.dataExportRequest.update({
          where: { id: exportRequest.id },
          data: { status: 'processing' },
        });

        // The actual processing will be handled by process-data-exports cron
        // We just mark them as ready to process
        processed++;

        logEvent('recurring_export_scheduled', {
          requestId: exportRequest.id,
          userId: exportRequest.userId,
          format: exportRequest.format,
        });
      } catch (error) {
        logError(error, {
          operation: 'schedule-recurring-export',
          requestId: exportRequest.id,
        });
      }
    }

    const result = {
      processed,
      total: dueExports.length,
    };

    logEvent('recurring_exports_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'recurring-exports-cron' });
    return NextResponse.json(
      { error: 'Failed to process recurring exports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
