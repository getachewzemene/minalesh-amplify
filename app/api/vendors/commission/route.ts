import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin } from '@/lib/middleware';
import { calculateMonthEndCommission } from '@/lib/vendor-payout';
import prisma from '@/lib/prisma';
import { z } from 'zod';

/**
 * GET /api/vendors/commission
 * 
 * Calculate month-end commission total for a vendor
 * 
 * Query params:
 * - vendorId: UUID (required)
 * - year: number (required)
 * - month: number (required, 1-12)
 */
export async function GET(request: NextRequest) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const year = parseInt(searchParams.get('year') || '0');
    const month = parseInt(searchParams.get('month') || '0');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    if (!month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month (must be 1-12)' },
        { status: 400 }
      );
    }

    const commission = await calculateMonthEndCommission(vendorId, year, month);

    if (!commission) {
      return NextResponse.json(
        { error: 'No commission data found for this period' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      commission,
    });
  } catch (error) {
    console.error('Error calculating commission:', error);
    return NextResponse.json(
      { error: 'Failed to calculate commission' },
      { status: 500 }
    );
  }
}

const updateRateSchema = z.object({
  vendorId: z.string().uuid(),
  commissionRate: z.number().min(0).max(1),
});

/**
 * PATCH /api/vendors/commission
 * 
 * Update vendor commission rate (admin only)
 * 
 * Body:
 * - vendorId: UUID (required)
 * - commissionRate: number (required, 0-1)
 */
export async function PATCH(request: NextRequest) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = updateRateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { vendorId, commissionRate } = parsed.data;

    // Verify vendor exists
    const vendor = await prisma.profile.findUnique({
      where: { id: vendorId },
      select: { id: true, isVendor: true },
    });

    if (!vendor || !vendor.isVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Update commission rate
    const updated = await prisma.profile.update({
      where: { id: vendorId },
      data: { commissionRate },
      select: {
        id: true,
        displayName: true,
        commissionRate: true,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: updated,
    });
  } catch (error) {
    console.error('Error updating commission rate:', error);
    return NextResponse.json(
      { error: 'Failed to update commission rate' },
      { status: 500 }
    );
  }
}
