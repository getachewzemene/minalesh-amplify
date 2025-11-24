import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile.addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching addresses' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - fullName
 *               - phone
 *               - addressLine1
 *               - city
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Home"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+251911234567"
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main St"
 *               addressLine2:
 *                 type: string
 *                 example: "Apt 4B"
 *               city:
 *                 type: string
 *                 example: "Addis Ababa"
 *               state:
 *                 type: string
 *                 example: "Addis Ababa"
 *               postalCode:
 *                 type: string
 *                 example: "1000"
 *               country:
 *                 type: string
 *                 example: "ET"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Address created successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault
    } = body;

    // Validate required fields
    if (!label || !fullName || !phone || !addressLine1 || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: payload.userId }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { profileId: profile.id },
        data: { isDefault: false }
      });
    }

    // Create the address
    const address = await prisma.address.create({
      data: {
        profileId: profile.id,
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: country || 'ET',
        isDefault: isDefault || false
      }
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the address' },
      { status: 500 }
    );
  }
}
