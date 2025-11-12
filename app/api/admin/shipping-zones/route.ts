import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

export async function GET(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {

    const shippingZones = await prisma.shippingZone.findMany({
      include: {
        shippingRates: {
          include: {
            method: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      shippingZones: shippingZones.map((zone) => ({
        ...zone,
        shippingRates: zone.shippingRates.map((rate) => ({
          ...rate,
          baseRate: Number(rate.baseRate),
          perKgRate: rate.perKgRate ? Number(rate.perKgRate) : null,
          freeShippingThreshold: rate.freeShippingThreshold
            ? Number(rate.freeShippingThreshold)
            : null,
          minOrderAmount: rate.minOrderAmount
            ? Number(rate.minOrderAmount)
            : null,
          maxOrderAmount: rate.maxOrderAmount
            ? Number(rate.maxOrderAmount)
            : null,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching shipping zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {

    const body = await request.json();
    const { name, description, countries, regions, cities, postalCodes } = body;

    // Validate required fields
    if (!name || !countries || !Array.isArray(countries)) {
      return NextResponse.json(
        { error: 'Name and countries array are required' },
        { status: 400 }
      );
    }

    // Create shipping zone
    const shippingZone = await prisma.shippingZone.create({
      data: {
        name,
        description,
        countries,
        regions: regions || [],
        cities: cities || [],
        postalCodes: postalCodes || [],
      },
    });

    return NextResponse.json(shippingZone);
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating shipping zone' },
      { status: 500 }
    );
  }
}
