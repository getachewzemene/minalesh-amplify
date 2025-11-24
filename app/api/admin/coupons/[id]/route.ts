import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   get:
 *     summary: Get a specific coupon (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon details
 *       404:
 *         description: Coupon not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        couponUsages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase
        ? Number(coupon.minimumPurchase)
        : null,
      maximumDiscount: coupon.maximumDiscount
        ? Number(coupon.maximumDiscount)
        : null,
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching coupon' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   put:
 *     summary: Update a coupon (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       404:
 *         description: Coupon not found
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
      status,
    } = body;

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minimumPurchase !== undefined) updateData.minimumPurchase = minimumPurchase;
    if (maximumDiscount !== undefined) updateData.maximumDiscount = maximumDiscount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (perUserLimit !== undefined) updateData.perUserLimit = perUserLimit;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (status !== undefined) updateData.status = status;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minimumPurchase: coupon.minimumPurchase
        ? Number(coupon.minimumPurchase)
        : null,
      maximumDiscount: coupon.maximumDiscount
        ? Number(coupon.maximumDiscount)
        : null,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating coupon' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       404:
 *         description: Coupon not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {

    await prisma.coupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting coupon' },
      { status: 500 }
    );
  }
}
