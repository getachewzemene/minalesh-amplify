import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { validateCoupon, isFreeShippingCoupon } from '@/lib/coupon';
import { getShippingRateById } from '@/lib/shipping';
import { calculateTax } from '@/lib/tax';

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    const body = await request.json();
    const {
      subtotal,
      couponCode,
      shippingRateId,
      shippingAddress,
      totalWeight,
    } = body;

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { error: 'Valid subtotal is required' },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    let couponData = null;
    let freeShipping = false;

    // Validate coupon if provided
    if (couponCode) {
      const couponResult = await validateCoupon(
        couponCode,
        payload?.userId || null,
        subtotal
      );

      if (couponResult.valid && couponResult.coupon) {
        couponData = couponResult.coupon;
        
        if (isFreeShippingCoupon(couponResult.coupon.discountType)) {
          freeShipping = true;
        } else {
          discountAmount = couponResult.discountAmount || 0;
        }
      }
    }

    // Calculate subtotal after discount
    const subtotalAfterDiscount = subtotal - discountAmount;

    // Calculate shipping
    let shippingAmount = 0;
    if (shippingRateId && !freeShipping) {
      const shippingRate = await getShippingRateById(shippingRateId);
      if (shippingRate) {
        shippingAmount = shippingRate.rate;
      }
    }

    // Calculate tax
    let taxAmount = 0;
    if (shippingAddress && shippingAddress.country) {
      const taxResult = await calculateTax(
        subtotalAfterDiscount,
        shippingAddress
      );
      taxAmount = taxResult.totalTaxAmount;
    }

    // Calculate total
    const total = subtotalAfterDiscount + shippingAmount + taxAmount;

    return NextResponse.json({
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      shippingAmount,
      taxAmount,
      total,
      coupon: couponData,
      freeShipping,
    });
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return NextResponse.json(
      { error: 'An error occurred while calculating cart total' },
      { status: 500 }
    );
  }
}
