import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/tax-rates:
 *   get:
 *     summary: Get all tax rates (Admin)
 *     description: Retrieve all tax rates with optional filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tax rates
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const { error, payload } = withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const whereClause: any = {};
    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    if (country) {
      whereClause.country = country;
    }

    const [taxRates, total] = await Promise.all([
      prisma.taxRate.findMany({
        where: whereClause,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.taxRate.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      taxRates: taxRates.map((rate) => ({
        ...rate,
        rate: Number(rate.rate),
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching tax rates' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/tax-rates:
 *   post:
 *     summary: Create a new tax rate (Admin)
 *     description: Create a new tax rate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - rate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               rate:
 *                 type: number
 *               country:
 *                 type: string
 *               region:
 *                 type: string
 *               city:
 *                 type: string
 *               taxType:
 *                 type: string
 *               isCompound:
 *                 type: boolean
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tax rate created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  const { error, payload } = withAdmin(request);
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
      priority,
    } = body;

    // Validate required fields
    if (!name || rate === undefined || rate === null) {
      return NextResponse.json(
        { error: 'Name and rate are required' },
        { status: 400 }
      );
    }

    // Create tax rate
    const taxRate = await prisma.taxRate.create({
      data: {
        name,
        description,
        rate,
        country: country || 'ET',
        region,
        city,
        taxType: taxType || 'VAT',
        isCompound: isCompound || false,
        priority: priority || 0,
      },
    });

    return NextResponse.json({
      ...taxRate,
      rate: Number(taxRate.rate),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tax rate:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating tax rate' },
      { status: 500 }
    );
  }
}
