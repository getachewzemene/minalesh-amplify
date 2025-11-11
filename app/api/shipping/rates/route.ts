import { NextResponse } from 'next/server';
import { getShippingOptions } from '@/lib/shipping';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, subtotal, totalWeight } = body;

    if (!address || !address.country) {
      return NextResponse.json(
        { error: 'Address with country is required' },
        { status: 400 }
      );
    }

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { error: 'Valid subtotal is required' },
        { status: 400 }
      );
    }

    const shippingOptions = await getShippingOptions(
      address,
      subtotal,
      totalWeight
    );

    if (shippingOptions.options.length === 0) {
      return NextResponse.json(
        {
          error: 'No shipping options available for this address',
          options: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      options: shippingOptions.options,
      cheapestOption: shippingOptions.cheapestOption,
      fastestOption: shippingOptions.fastestOption,
    });
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    return NextResponse.json(
      { error: 'An error occurred while calculating shipping rates' },
      { status: 500 }
    );
  }
}
