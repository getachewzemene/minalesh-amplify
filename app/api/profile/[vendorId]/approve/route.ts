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

    // TODO: Add admin check here

    // Approve vendor
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
