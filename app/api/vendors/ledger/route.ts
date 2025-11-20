import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin } from '@/lib/middleware';
import { isAdmin } from '@/lib/auth';
import { getVendorLedger } from '@/lib/vendor-payout';
import prisma from '@/lib/prisma';

/**
 * GET /api/vendors/ledger
 * 
 * Get commission ledger entries for a vendor
 * 
 * Query params:
 * - vendorId: UUID (required for admin, optional for vendors viewing their own)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - status: string (optional)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const userIsAdmin = isAdmin(payload!.role);

    // If not admin, ensure user can only view their own ledger
    if (!userIsAdmin) {
      const profile = await prisma.profile.findUnique({
        where: { userId: payload!.userId },
        select: { id: true, isVendor: true },
      });

      if (!profile?.isVendor) {
        return NextResponse.json(
          { error: 'Not a vendor' },
          { status: 403 }
        );
      }

      vendorId = profile.id;
    }

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || undefined,
      limit,
      offset,
    };

    const result = await getVendorLedger(vendorId, options);

    return NextResponse.json({
      success: true,
      ...result,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor ledger:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger' },
      { status: 500 }
    );
  }
}
