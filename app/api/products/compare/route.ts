import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
)

async function verifyAuth(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

/**
 * @swagger
 * /api/products/compare:
 *   get:
 *     tags: [Products]
 *     summary: Get product comparison lists
 *     description: Get all product comparison lists for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Product comparison lists retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Products]
 *     summary: Create or update product comparison
 *     description: Add products to comparison list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product IDs to compare (2-4 products)
 *     responses:
 *       200:
 *         description: Comparison created/updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    const [comparisons, total] = await Promise.all([
      prisma.productComparison.findMany({
        where: { userId: user.userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.productComparison.count({
        where: { userId: user.userId },
      }),
    ])

    return NextResponse.json({
      comparisons,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Error fetching product comparisons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparisons' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array' },
        { status: 400 }
      )
    }

    if (productIds.length < 2 || productIds.length > 4) {
      return NextResponse.json(
        { error: 'You can compare between 2 and 4 products' },
        { status: 400 }
      )
    }

    // Verify all products exist
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      )
    }

    // Create or update comparison
    // Check if user already has a comparison
    const existingComparison = await prisma.productComparison.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
    })

    let comparison
    if (existingComparison) {
      // Update existing comparison
      comparison = await prisma.productComparison.update({
        where: { id: existingComparison.id },
        data: {
          productIds,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new comparison
      comparison = await prisma.productComparison.create({
        data: {
          userId: user.userId,
          productIds,
        },
      })
    }

    return NextResponse.json({
      message: 'Comparison saved successfully',
      comparison,
    })
  } catch (error) {
    console.error('Error creating product comparison:', error)
    return NextResponse.json(
      { error: 'Failed to create comparison' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/products/compare:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product comparison
 *     description: Delete a product comparison list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comparison ID to delete
 *     responses:
 *       200:
 *         description: Comparison deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comparison not found
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Comparison ID is required' },
        { status: 400 }
      )
    }

    // Verify comparison exists and belongs to user
    const comparison = await prisma.productComparison.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      )
    }

    await prisma.productComparison.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Comparison deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product comparison:', error)
    return NextResponse.json(
      { error: 'Failed to delete comparison' },
      { status: 500 }
    )
  }
}
