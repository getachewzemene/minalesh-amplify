import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { 
  verifyTradeLicense, 
  verifyTINCertificate, 
  verifyBusinessRegistration 
} from '@/lib/ocr-verification';
import { comprehensiveGovVerification } from '@/lib/gov-api-integration';

/**
 * @swagger
 * /api/admin/vendors/verification/ocr:
 *   post:
 *     summary: Verify vendor documents using OCR and government APIs
 *     description: Run OCR verification on vendor documents (admin only)
 *     tags: [Admin, Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *             properties:
 *               vendorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Verification completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Vendor verification not found
 */

async function runOCRVerificationHandler(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Get vendor verification
    const verification = await prisma.vendorVerification.findUnique({
      where: { vendorId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Vendor verification not found' },
        { status: 404 }
      );
    }

    // Perform OCR verification
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

    // Update verification record with results
    const ocrPassed = Object.keys(ocrResults).length > 0 && 
      Object.values(ocrResults).every((r: any) => r.verified !== false);

    await prisma.vendorVerification.update({
      where: { id: verification.id },
      data: {
        ocrVerified: ocrPassed,
        ocrVerificationData: ocrResults,
        govApiVerified: govResults.allVerified,
        govApiVerificationData: govResults,
      },
    });

    return NextResponse.json({
      success: true,
      ocrResults,
      govResults,
      ocrPassed,
      govPassed: govResults.allVerified,
    });
  } catch (error) {
    console.error('Error running OCR verification:', error);
    throw error;
  }
}

export const POST = withApiLogger(
  withRoleCheck(runOCRVerificationHandler, ['admin'])
);
