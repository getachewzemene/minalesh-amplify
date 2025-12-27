import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/vendors/stats:
 *   get:
 *     summary: Get vendor statistics
 *     description: Retrieve statistics including seller ratings for a specific vendor
 *     tags: [Vendors]
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor Profile ID
 *     responses:
 *       200:
 *         description: Vendor statistics
 *       400:
 *         description: Vendor ID required
 *       404:
 *         description: Vendor not found
 */

async function getVendorStatsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendor = await prisma.profile.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        displayName: true,
        isVendor: true,
        vendorStatus: true,
        createdAt: true,
      },
    });

    if (!vendor || !vendor.isVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get seller rating statistics
    const ratingStats = await prisma.sellerRating.aggregate({
      where: { vendorId },
      _avg: {
        overallRating: true,
        communication: true,
        shippingSpeed: true,
        accuracy: true,
        customerService: true,
      },
      _count: {
        id: true,
      },
    });

    // Get product count
    const productCount = await prisma.product.count({
      where: { vendorId, isActive: true },
    });

    // Get total sales
    const salesData = await prisma.orderItem.aggregate({
      where: {
        vendorId,
        order: {
          status: { in: ['delivered', 'fulfilled'] },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Get verification status
    const verification = await prisma.vendorVerification.findUnique({
      where: { vendorId },
      select: {
        status: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        displayName: vendor.displayName,
        status: vendor.vendorStatus,
        memberSince: vendor.createdAt,
      },
      verification: {
        status: verification?.status || 'pending',
        verifiedAt: verification?.reviewedAt,
      },
      ratings: {
        totalRatings: ratingStats._count.id,
        averageOverallRating: ratingStats._avg.overallRating
          ? Number(ratingStats._avg.overallRating.toFixed(2))
          : null,
        averageCommunication: ratingStats._avg.communication
          ? Number(ratingStats._avg.communication.toFixed(2))
          : null,
        averageShippingSpeed: ratingStats._avg.shippingSpeed
          ? Number(ratingStats._avg.shippingSpeed.toFixed(2))
          : null,
        averageAccuracy: ratingStats._avg.accuracy
          ? Number(ratingStats._avg.accuracy.toFixed(2))
          : null,
        averageCustomerService: ratingStats._avg.customerService
          ? Number(ratingStats._avg.customerService.toFixed(2))
          : null,
      },
      products: {
        totalActive: productCount,
      },
      sales: {
        totalItemsSold: salesData._sum.quantity || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    throw error;
  }
}

export const GET = withApiLogger(getVendorStatsHandler);
