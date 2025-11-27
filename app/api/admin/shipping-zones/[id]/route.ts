import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/shipping-zones/{id}:
 *   get:
 *     summary: Get a specific shipping zone (Admin)
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
 *         description: Shipping zone details
 *       404:
 *         description: Shipping zone not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {
    const shippingZone = await prisma.shippingZone.findUnique({
      where: { id: params.id },
      include: {
        shippingRates: {
          include: {
            method: true,
          },
        },
      },
    });

    if (!shippingZone) {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...shippingZone,
      shippingRates: shippingZone.shippingRates.map((rate) => ({
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
    });
  } catch (error) {
    console.error('Error fetching shipping zone:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching shipping zone' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/shipping-zones/{id}:
 *   put:
 *     summary: Update a shipping zone (Admin)
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
 *         description: Shipping zone updated successfully
 *       404:
 *         description: Shipping zone not found
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, countries, regions, cities, postalCodes, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (countries !== undefined) updateData.countries = countries;
    if (regions !== undefined) updateData.regions = regions;
    if (cities !== undefined) updateData.cities = cities;
    if (postalCodes !== undefined) updateData.postalCodes = postalCodes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const shippingZone = await prisma.shippingZone.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shippingRates: {
          include: {
            method: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...shippingZone,
      shippingRates: shippingZone.shippingRates.map((rate) => ({
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
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      );
    }
    console.error('Error updating shipping zone:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating shipping zone' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/shipping-zones/{id}:
 *   delete:
 *     summary: Delete a shipping zone (Admin)
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
 *         description: Shipping zone deleted successfully
 *       404:
 *         description: Shipping zone not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {
    await prisma.shippingZone.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Shipping zone deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Shipping zone not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting shipping zone:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting shipping zone' },
      { status: 500 }
    );
  }
}
