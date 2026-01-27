import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/flash-sales
 * Get active and upcoming flash sales
 */
export async function GET() {
  try {
    const now = new Date();
    
    const flashSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        endsAt: {
          gte: now, // Only show sales that haven't ended yet
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            description: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    return NextResponse.json({
      flashSales: flashSales.map((sale) => ({
        ...sale,
        discountValue: Number(sale.discountValue),
        originalPrice: Number(sale.originalPrice),
        flashPrice: Number(sale.flashPrice),
        stockRemaining: sale.stockLimit ? sale.stockLimit - sale.stockSold : null,
        registrationCount: sale._count.registrations,
      })),
    });
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sales' },
      { status: 500 }
    );
  }
}
