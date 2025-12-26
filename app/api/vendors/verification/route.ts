import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/vendors/verification:
 *   post:
 *     summary: Submit vendor verification documents
 *     description: Upload verification documents for vendor approval (vendors only)
 *     tags: [Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tradeLicenseUrl
 *               - tradeLicenseNumber
 *               - tinCertificateUrl
 *               - tinNumber
 *             properties:
 *               tradeLicenseUrl:
 *                 type: string
 *                 description: URL to uploaded trade license document
 *               tradeLicenseNumber:
 *                 type: string
 *               tinCertificateUrl:
 *                 type: string
 *                 description: URL to uploaded TIN certificate
 *               tinNumber:
 *                 type: string
 *               businessRegUrl:
 *                 type: string
 *                 description: URL to business registration (optional)
 *               ownerIdUrl:
 *                 type: string
 *                 description: URL to owner ID (optional)
 *     responses:
 *       201:
 *         description: Verification documents submitted successfully
 *       400:
 *         description: Invalid request or vendor not found
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get vendor verification status
 *     description: Retrieve verification status for the current vendor
 *     tags: [Vendors, Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No verification record found
 */

async function submitVerificationHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      tradeLicenseUrl,
      tradeLicenseNumber,
      tinCertificateUrl,
      tinNumber,
      businessRegUrl,
      ownerIdUrl,
    } = body;

    // Validate required fields
    if (!tradeLicenseUrl || !tradeLicenseNumber || !tinCertificateUrl || !tinNumber) {
      return NextResponse.json(
        {
          error: 'Trade license and TIN certificate information are required',
        },
        { status: 400 }
      );
    }

    // Check for existing verification
    const existingVerification = await prisma.vendorVerification.findUnique({
      where: { vendorId: profile.id },
    });

    let verification;
    if (existingVerification) {
      // Update existing verification
      verification = await prisma.vendorVerification.update({
        where: { vendorId: profile.id },
        data: {
          tradeLicenseUrl,
          tradeLicenseNumber,
          tinCertificateUrl,
          tinNumber,
          businessRegUrl,
          ownerIdUrl,
          status: 'pending',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new verification
      verification = await prisma.vendorVerification.create({
        data: {
          vendorId: profile.id,
          tradeLicenseUrl,
          tradeLicenseNumber,
          tinCertificateUrl,
          tinNumber,
          businessRegUrl,
          ownerIdUrl,
          status: 'pending',
        },
      });
    }

    // TODO: Send email notification to admin about new verification request
    // TODO: Send confirmation email to vendor

    return NextResponse.json(
      {
        message: 'Verification documents submitted successfully. Our team will review them shortly.',
        verification: {
          id: verification.id,
          status: verification.status,
          submittedAt: verification.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting verification:', error);
    throw error;
  }
}

async function getVerificationStatusHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 400 }
      );
    }

    const verification = await prisma.vendorVerification.findUnique({
      where: { vendorId: profile.id },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        submittedAt: true,
        updatedAt: true,
        tradeLicenseNumber: true,
        tinNumber: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'No verification record found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    throw error;
  }
}

export const POST = withApiLogger(
  withRoleCheck(submitVerificationHandler, ['vendor', 'admin'])
);
export const GET = withApiLogger(
  withRoleCheck(getVerificationStatusHandler, ['vendor', 'admin'])
);
