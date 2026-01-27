import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/flash-sales/[id]
 * Get a specific flash sale by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            description: true,
            categoryId: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!flashSale) {
      return NextResponse.json(
        { error: 'Flash sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...flashSale,
      discountValue: Number(flashSale.discountValue),
      originalPrice: Number(flashSale.originalPrice),
      flashPrice: Number(flashSale.flashPrice),
      stockRemaining: flashSale.stockLimit ? flashSale.stockLimit - flashSale.stockSold : null,
      registrationCount: flashSale._count.registrations,
    });
  } catch (error) {
    console.error('Error fetching flash sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sale' },
      { status: 500 }
    );
  }
}
