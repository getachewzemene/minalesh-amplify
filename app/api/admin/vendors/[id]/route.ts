import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/vendors/{id}:
 *   patch:
 *     summary: Update vendor verification status
 *     description: Approve, reject, or suspend a vendor (admin only)
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorStatus
 *             properties:
 *               vendorStatus:
 *                 type: string
 *                 enum: [pending, approved, rejected, suspended]
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *       400:
 *         description: Invalid status or vendor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
async function updateVendorStatusHandler(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    const body = await request.json();
    const { vendorStatus } = body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!vendorStatus || !validStatuses.includes(vendorStatus)) {
      return NextResponse.json(
        { error: 'Invalid vendor status. Must be one of: pending, approved, rejected, suspended' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (!vendor.isVendor) {
      return NextResponse.json(
        { error: 'Profile is not a vendor account' },
        { status: 400 }
      );
    }

    // Update vendor status
    const updatedVendor = await prisma.profile.update({
      where: { id },
      data: {
        vendorStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // TODO: Send email notification to vendor about status change
    // This can be added later using the email service

    return NextResponse.json({
      message: `Vendor status updated to ${vendorStatus}`,
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    throw error;
  }
}

// Apply role check middleware (admin only)
export const PATCH = withApiLogger(
  withRoleCheck(updateVendorStatusHandler, ['admin'])
);
