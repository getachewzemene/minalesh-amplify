import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

export async function POST(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {
    // Approve vendor
    const profile = await prisma.profile.update({
      where: { id: params.vendorId },
      data: { vendorStatus: 'approved' },
    });

    // Update user role to vendor
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: 'vendor' },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Vendor approval error:', error);
    return NextResponse.json(
      { error: 'An error occurred while approving vendor' },
      { status: 500 }
    );
  }
}
