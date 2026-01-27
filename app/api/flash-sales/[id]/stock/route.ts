import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/flash-sales/[id]/stock
 * Get real-time stock information for a flash sale
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
      select: {
        id: true,
        stockLimit: true,
        stockSold: true,
        isActive: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!flashSale) {
      return NextResponse.json(
        { error: 'Flash sale not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isActive = flashSale.isActive && now >= flashSale.startsAt && now < flashSale.endsAt;
    const stockRemaining = flashSale.stockLimit ? flashSale.stockLimit - flashSale.stockSold : null;
    const stockPercentage = flashSale.stockLimit 
      ? Math.round((flashSale.stockSold / flashSale.stockLimit) * 100)
      : 0;

    return NextResponse.json({
      id: flashSale.id,
      isActive,
      stockLimit: flashSale.stockLimit,
      stockSold: flashSale.stockSold,
      stockRemaining,
      stockPercentage,
      hasStarted: now >= flashSale.startsAt,
      hasEnded: now >= flashSale.endsAt,
    });
  } catch (error) {
    console.error('Error fetching flash sale stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    );
  }
}
