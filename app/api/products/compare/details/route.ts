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
 * /api/products/compare/details:
 *   get:
 *     tags: [Products]
 *     summary: Get detailed product comparison
 *     description: Get detailed information for comparing multiple products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated product IDs (2-4 products)
 *     responses:
 *       200:
 *         description: Product comparison details retrieved successfully
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
    const productIdsParam = searchParams.get('productIds')

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'productIds parameter is required' },
        { status: 400 }
      )
    }

    const productIds = productIdsParam.split(',').filter(id => id.trim())

    if (productIds.length < 2 || productIds.length > 4) {
      return NextResponse.json(
        { error: 'You can compare between 2 and 4 products' },
        { status: 400 }
      )
    }

    // Fetch products with detailed information
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        vendor: {
          select: {
            displayName: true,
            isVerified: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      )
    }

    // Format product data for comparison
    const comparisonData = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        discount: product.discount,
        stock: product.stock,
        category: product.category?.name || 'Uncategorized',
        vendor: {
          name: product.vendor?.displayName || 'Unknown',
          verified: product.vendor?.isVerified || false,
        },
        image: product.images[0]?.url || null,
        rating: Number(avgRating.toFixed(2)),
        reviewCount: product.reviews.length,
        specifications: product.specifications,
        features: product.features,
        shipping: {
          weight: product.weight,
          dimensions: product.dimensions,
        },
      }
    })

    return NextResponse.json({
      products: comparisonData,
      comparisonDate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching comparison details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison details' },
      { status: 500 }
    )
  }
}
