import { NextResponse } from 'next/server';
import { withAuth, withAdmin } from '@/lib/middleware';
import { isAdmin } from '@/lib/auth';
import {
  calculateVendorPayout,
  createVendorPayout,
  markPayoutAsPaid,
  getPendingPayouts,
  getVendorPayoutSummary,
} from '@/lib/vendor-payout';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const calculateSchema = z.object({
  vendorId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  commissionRate: z.number().min(0).max(1).optional(),
});

const markPaidSchema = z.object({
  payoutId: z.string().uuid(),
});

// POST /api/vendors/payouts/calculate - Calculate payout (admin only)
export async function POST(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {

    const body = await request.json();
    const parsed = calculateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { vendorId, periodStart, periodEnd, commissionRate } = parsed.data;

    const calculation = await calculateVendorPayout(
      vendorId,
      new Date(periodStart),
      new Date(periodEnd),
      commissionRate
    );

    if (!calculation) {
      return NextResponse.json(
        { error: 'No sales found for this period' },
        { status: 404 }
      );
    }

    // Create payout record
    const payoutId = await createVendorPayout(calculation);

    if (!payoutId) {
      return NextResponse.json(
        { error: 'Failed to create payout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payoutId,
      calculation,
    });
  } catch (error) {
    console.error('Error calculating payout:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/vendors/payouts - Get payouts
export async function GET(request: Request) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const pending = searchParams.get('pending') === 'true';

    // Admin can view all, vendors can only view their own
    const userIsAdmin = isAdmin(payload!.role);

    if (pending && !userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    if (pending) {
      const payouts = await getPendingPayouts();
      return NextResponse.json({ payouts });
    }

    if (vendorId) {
      // Check authorization
      if (!userIsAdmin) {
        const profile = await prisma.profile.findUnique({
          where: { userId: payload!.userId },
          select: { id: true },
        });

        if (profile?.id !== vendorId) {
          return NextResponse.json(
            { error: 'Forbidden - You can only view your own payouts' },
            { status: 403 }
          );
        }
      }

      const summary = await getVendorPayoutSummary(vendorId);
      return NextResponse.json(summary);
    }

    // Get current vendor's payouts
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

    const summary = await getVendorPayoutSummary(profile.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/vendors/payouts - Mark payout as paid (admin only)
export async function PATCH(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {

    const body = await request.json();
    const parsed = markPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { payoutId } = parsed.data;
    const success = await markPayoutAsPaid(payoutId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark payout as paid' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
