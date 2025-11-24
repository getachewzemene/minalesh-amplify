import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/tax-rates/{id}:
 *   get:
 *     summary: Get a specific tax rate (Admin)
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
 *         description: Tax rate details
 *       404:
 *         description: Tax rate not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: params.id },
    });

    if (!taxRate) {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...taxRate,
      rate: Number(taxRate.rate),
    });
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching tax rate' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/tax-rates/{id}:
 *   put:
 *     summary: Update a tax rate (Admin)
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
 *         description: Tax rate updated successfully
 *       404:
 *         description: Tax rate not found
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
      name,
      description,
      rate,
      country,
      region,
      city,
      taxType,
      isCompound,
      isActive,
      priority,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rate !== undefined) updateData.rate = rate;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (city !== undefined) updateData.city = city;
    if (taxType !== undefined) updateData.taxType = taxType;
    if (isCompound !== undefined) updateData.isCompound = isCompound;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priority !== undefined) updateData.priority = priority;

    const taxRate = await prisma.taxRate.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      ...taxRate,
      rate: Number(taxRate.rate),
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }
    console.error('Error updating tax rate:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating tax rate' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/tax-rates/{id}:
 *   delete:
 *     summary: Delete a tax rate (Admin)
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
 *         description: Tax rate deleted successfully
 *       404:
 *         description: Tax rate not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = withAdmin(request);
  if (error) return error;

  try {
    await prisma.taxRate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tax rate deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting tax rate:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting tax rate' },
      { status: 500 }
    );
  }
}
