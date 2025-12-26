import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';

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

    // Generate export data
    const exportData = await generateUserDataExport(exportRequest.userId);

    // Convert to requested format
    let fileContent: string;
    let fileName: string;
    
    if (exportRequest.format === 'csv') {
      fileContent = convertToCSV(exportData);
      fileName = `user-data-export-${exportRequest.userId}.csv`;
    } else {
      // JSON format (default)
      fileContent = JSON.stringify(exportData, null, 2);
      fileName = `user-data-export-${exportRequest.userId}.json`;
    }

    // In a production environment, you would:
    // 1. Upload to S3 or similar storage
    // 2. Generate a signed URL with expiration
    // For now, we'll store it as base64 data URL (not recommended for production)
    
    const fileSize = Buffer.byteLength(fileContent, 'utf8');
    const base64Content = Buffer.from(fileContent).toString('base64');
    const mimeType = exportRequest.format === 'csv' ? 'text/csv' : 'application/json';
    const downloadUrl = `data:${mimeType};base64,${base64Content}`;

    // TODO: In production, replace with actual file upload to S3:
    // const s3Url = await uploadToS3(fileContent, fileName);
    // const downloadUrl = await generateSignedUrl(s3Url, exportRequest.expiresAt);

    // Mark as completed
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: {
        status: 'completed',
        downloadUrl,
        fileSize,
        completedAt: new Date(),
      },
    });

    // TODO: Send email notification to user with download link
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

    logEvent('data_export_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
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
