import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Admin role check required
    // TODO: Implement proper admin role verification
    // For now, this endpoint should not be used in production without admin checks
    // Example: Check if user has admin role in database
    // const user = await prisma.user.findUnique({
    //   where: { id: payload.userId },
    //   include: { profile: true }
    // });
    // if (!user?.profile?.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    // }

    return NextResponse.json(
      { error: 'Not implemented: Admin verification required before this endpoint can be used' },
      { status: 501 }
    );

    // Approve vendor (disabled until admin checks are implemented)
    const profile = await prisma.profile.update({
      where: { id: params.vendorId },
      data: { vendorStatus: 'approved' },
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
