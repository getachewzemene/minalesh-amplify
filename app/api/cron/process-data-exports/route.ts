import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';
import { generatePDFExport, generateCategoryPDFExport } from '@/lib/pdf-export';

/**
 * Data Export Worker
 * Processes pending data export requests
 * 
 * This endpoint should be called by a cron job every 10-15 minutes
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

interface ExportData {
  user: any;
  profile: any;
  orders: any[];
  reviews: any[];
  addresses: any[];
  wishlists: any[];
  preferences: any;
  notificationPreferences: any;
  loyaltyAccount: any;
}

async function generateUserDataExport(userId: string): Promise<ExportData> {
  // Fetch all user data
  const [user, profile, orders, reviews, addresses, wishlists, preferences, notificationPreferences, loyaltyAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId },
    }),
    prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: {
        addresses: true,
      },
    }).then(p => p?.addresses || []),
    prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    }),
    prisma.userPreferences.findUnique({
      where: { userId },
    }),
    prisma.notificationPreference.findUnique({
      where: { userId },
    }),
    prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: true,
      },
    }),
  ]);

  return {
    user,
    profile,
    orders,
    reviews,
    addresses,
    wishlists,
    preferences,
    notificationPreferences,
    loyaltyAccount,
  };
}

function convertToCSV(data: ExportData): string {
  // Simple CSV export - just basic user info
  const lines = [
    'Section,Field,Value',
    `User,Email,${data.user?.email || ''}`,
    `User,Role,${data.user?.role || ''}`,
    `User,Account Created,${data.user?.createdAt || ''}`,
    `Profile,Display Name,${data.profile?.displayName || ''}`,
    `Profile,First Name,${data.profile?.firstName || ''}`,
    `Profile,Last Name,${data.profile?.lastName || ''}`,
    `Profile,Phone,${data.profile?.phone || ''}`,
    `Orders,Total Orders,${data.orders?.length || 0}`,
    `Reviews,Total Reviews,${data.reviews?.length || 0}`,
    `Wishlist,Total Items,${data.wishlists?.length || 0}`,
    `Loyalty,Points,${data.loyaltyAccount?.points || 0}`,
    `Loyalty,Tier,${data.loyaltyAccount?.tier || 'none'}`,
  ];

  return lines.join('\n');
}

async function processDataExport(exportRequest: any): Promise<void> {
  try {
    // Mark as processing
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: { status: 'processing' },
    });

    // Generate export data - filtered by categories if specified
    let exportData = await generateUserDataExport(exportRequest.userId);
    
    // Filter by categories if specified
    if (exportRequest.categories && exportRequest.categories.length > 0) {
      const filteredData: any = {
        user: exportData.user,
        profile: exportData.profile,
      };
      
      exportRequest.categories.forEach((category: string) => {
        if (category === 'orders') filteredData.orders = exportData.orders;
        if (category === 'reviews') filteredData.reviews = exportData.reviews;
        if (category === 'addresses') filteredData.addresses = exportData.addresses;
        if (category === 'wishlists') filteredData.wishlists = exportData.wishlists;
        if (category === 'preferences') filteredData.preferences = exportData.preferences;
        if (category === 'loyalty') filteredData.loyaltyAccount = exportData.loyaltyAccount;
      });
      
      exportData = filteredData;
    }

    // Convert to requested format
    let fileContent: string | Buffer;
    let fileName: string;
    let mimeType: string;
    
    if (exportRequest.format === 'csv') {
      fileContent = convertToCSV(exportData);
      fileName = `user-data-export-${exportRequest.userId}.csv`;
      mimeType = 'text/csv';
    } else if (exportRequest.format === 'pdf') {
      // Generate PDF
      fileContent = exportRequest.categories && exportRequest.categories.length > 0
        ? await generateCategoryPDFExport(exportData, exportRequest.categories)
        : await generatePDFExport(exportData);
      fileName = `user-data-export-${exportRequest.userId}.pdf`;
      mimeType = 'application/pdf';
    } else {
      // JSON format (default)
      fileContent = JSON.stringify(exportData, null, 2);
      fileName = `user-data-export-${exportRequest.userId}.json`;
      mimeType = 'application/json';
    }

    // In a production environment, you would:
    // 1. Upload to S3 or similar storage
    // 2. Generate a signed URL with expiration
    // For now, we'll store it as base64 data URL (not recommended for production)
    
    const fileSize = Buffer.isBuffer(fileContent) 
      ? fileContent.length 
      : Buffer.byteLength(fileContent, 'utf8');
    const base64Content = Buffer.isBuffer(fileContent)
      ? fileContent.toString('base64')
      : Buffer.from(fileContent).toString('base64');
    const downloadUrl = `data:${mimeType};base64,${base64Content}`;

    // TODO: In production, replace with actual file upload to S3:
    // const s3Url = await uploadToS3(fileContent, fileName);
    // const downloadUrl = await generateSignedUrl(s3Url, exportRequest.expiresAt);

    // For recurring exports, schedule next run
    let updateData: any = {
      status: 'completed',
      downloadUrl,
      fileSize,
      completedAt: new Date(),
    };

    if (exportRequest.isRecurring && exportRequest.recurringSchedule) {
      // Calculate next run time based on schedule
      // For simplicity, we'll just add 7 days (should use proper cron parser in production)
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 7);
      updateData.nextRunAt = nextRun;
      updateData.status = 'pending'; // Reset to pending for next run
    }

    // Mark as completed
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: updateData,
    });

    // Send email notification to user with download link
    const user = await prisma.user.findUnique({
      where: { id: exportRequest.userId },
      select: { email: true },
    });

    if (user) {
      const { queueEmail, createDataExportReadyEmail } = await import('@/lib/email');
      const emailTemplate = createDataExportReadyEmail(
        user.email,
        downloadUrl,
        exportRequest.expiresAt,
        exportRequest.format
      );
      await queueEmail(emailTemplate);
    }

    logEvent('data_export_completed', {
      requestId: exportRequest.id,
      userId: exportRequest.userId,
      format: exportRequest.format,
      fileSize,
    });

  } catch (error) {
    // Mark as failed
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    logError(error, {
      operation: 'process-data-export',
      requestId: exportRequest.id,
    });

    throw error;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
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

    // Clean up expired exports first
    await prisma.dataExportRequest.updateMany({
      where: {
        status: 'completed',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
        downloadUrl: null, // Remove download URL for expired exports
      },
    });

    // Get pending export requests
    const pendingExports = await prisma.dataExportRequest.findMany({
      where: {
        status: 'pending',
      },
      take: 5, // Process up to 5 exports per run
      orderBy: {
        createdAt: 'asc',
      },
    });

    let processed = 0;
    let failed = 0;

    for (const exportRequest of pendingExports) {
      try {
        await processDataExport(exportRequest);
        processed++;
      } catch (error) {
        failed++;
        logError(error, {
          operation: 'process-data-export-loop',
          requestId: exportRequest.id,
        });
      }
    }

    const result = {
      processed,
      failed,
      total: pendingExports.length,
    };

    const duration = Date.now() - startTime;

    // Log execution to monitoring
    await prisma.cronJobExecution.create({
      data: {
        jobName: 'process-data-exports',
        status: 'success',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration,
        recordsProcessed: processed,
        metadata: result,
      },
    });

    logEvent('data_export_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed execution
    try {
      await prisma.cronJobExecution.create({
        data: {
          jobName: 'process-data-exports',
          status: 'failed',
          startedAt: new Date(startTime),
          completedAt: new Date(),
          duration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log cron execution:', logError);
    }

    logError(error, { operation: 'process-data-exports-cron' });
    return NextResponse.json(
      { error: 'Failed to process data exports' },
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
