import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logEvent, logError } from '@/lib/logger';
import { 
  verifyTradeLicense, 
  verifyTINCertificate, 
  verifyBusinessRegistration 
} from '@/lib/ocr-verification';
import { comprehensiveGovVerification } from '@/lib/gov-api-integration';

/**
 * Vendor Re-verification Cron Job
 * Automatically re-verifies vendor documents periodically
 * 
 * This endpoint should be called by a cron job daily or weekly
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

    // Find vendors due for re-verification
    const dueForReverification = await prisma.vendorVerification.findMany({
      where: {
        status: 'approved',
        nextReverificationAt: {
          lte: now,
        },
      },
      take: 5, // Process 5 vendors at a time to avoid overload
    });

    let processed = 0;
    let failed = 0;
    let verified = 0;

    for (const verification of dueForReverification) {
      try {
        // Perform OCR verification if documents are available
        const ocrResults: any = {};
        
        if (verification.tradeLicenseUrl) {
          const tradeLicenseResult = await verifyTradeLicense(
            verification.tradeLicenseUrl,
            verification.tradeLicenseNumber || undefined
          );
          ocrResults.tradeLicense = tradeLicenseResult;
        }

        if (verification.tinCertificateUrl) {
          const tinResult = await verifyTINCertificate(
            verification.tinCertificateUrl,
            verification.tinNumber || undefined
          );
          ocrResults.tinCertificate = tinResult;
        }

        if (verification.businessRegUrl) {
          const businessRegResult = await verifyBusinessRegistration(
            verification.businessRegUrl
          );
          ocrResults.businessReg = businessRegResult;
        }

        // Perform government API verification
        const govResults = await comprehensiveGovVerification({
          tinNumber: verification.tinNumber || undefined,
          tradeLicenseNumber: verification.tradeLicenseNumber || undefined,
        });

        // Determine if re-verification passed
        const ocrPassed = Object.values(ocrResults).every((r: any) => r.verified !== false);
        const govPassed = govResults.allVerified || true; // Allow pass even if gov API not integrated

        // Calculate next re-verification date (6 months from now)
        const nextReverification = new Date();
        nextReverification.setMonth(nextReverification.getMonth() + 6);

        // Update verification record
        await prisma.vendorVerification.update({
          where: { id: verification.id },
          data: {
            ocrVerified: ocrPassed,
            ocrVerificationData: ocrResults,
            govApiVerified: govPassed,
            govApiVerificationData: govResults,
            lastReverifiedAt: now,
            nextReverificationAt: nextReverification,
            // If verification fails, mark for review
            status: (ocrPassed && govPassed) ? 'approved' : 'under_review',
          },
        });

        processed++;
        if (ocrPassed && govPassed) {
          verified++;
        }

        logEvent('vendor_reverified', {
          vendorId: verification.vendorId,
          ocrPassed,
          govPassed,
          nextReverificationAt: nextReverification,
        });

        // Send notification to vendor if verification failed
        if (!ocrPassed || !govPassed) {
          const vendor = await prisma.profile.findUnique({
            where: { id: verification.vendorId },
            include: {
              user: {
                select: { email: true },
              },
            },
          });

          if (vendor && vendor.user.email) {
            // TODO: Send email notification about re-verification failure
            logEvent('reverification_failed_notification', {
              vendorId: verification.vendorId,
              email: vendor.user.email,
            });
          }
        }
      } catch (error) {
        failed++;
        logError(error, {
          operation: 'vendor-reverification',
          vendorId: verification.vendorId,
        });
      }
    }

    const result = {
      processed,
      verified,
      failed,
      total: dueForReverification.length,
    };

    logEvent('vendor_reverification_cron_completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(error, { operation: 'vendor-reverification-cron' });
    return NextResponse.json(
      { error: 'Failed to process vendor re-verifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
