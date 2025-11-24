import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { isAdmin } from '@/lib/auth';
import { getVendorStatements } from '@/lib/vendor-payout';
import prisma from '@/lib/prisma';

/**
 * GET /api/vendors/statements
 * 
 * Get vendor statements
 * 
 * Query params:
 * - vendorId: UUID (required for admin, optional for vendors viewing their own)
 * - limit: number (default: 10)
 */
export async function GET(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendorId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const userIsAdmin = isAdmin(payload!.role);

    // If not admin, ensure user can only view their own statements
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

    const statements = await getVendorStatements(vendorId, limit);

    return NextResponse.json({
      success: true,
      statements,
    });
  } catch (error) {
    console.error('Error fetching vendor statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
}
