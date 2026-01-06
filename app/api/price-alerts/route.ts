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
 * /api/price-alerts:
 *   get:
 *     tags: [PriceAlerts]
 *     summary: Get user's price alerts
 *     description: Get all price alerts for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Price alerts retrieved successfully
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
    const isActive = searchParams.get('active')

    const where: Record<string, unknown> = { userId: user.userId }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const priceAlerts = await prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Fetch product details for each alert
    const productIds = priceAlerts.map(alert => alert.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        images: true,
      },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    const alertsWithProducts = priceAlerts.map(alert => ({
      id: alert.id,
      targetPrice: Number(alert.targetPrice),
      isActive: alert.isActive,
      triggered: alert.triggered,
      triggeredAt: alert.triggeredAt,
      createdAt: alert.createdAt,
      product: productMap.get(alert.productId) ? {
        id: productMap.get(alert.productId)!.id,
        name: productMap.get(alert.productId)!.name,
        slug: productMap.get(alert.productId)!.slug,
        price: Number(productMap.get(alert.productId)!.price),
        salePrice: productMap.get(alert.productId)!.salePrice ? Number(productMap.get(alert.productId)!.salePrice) : null,
        image: (() => {
          const images = productMap.get(alert.productId)!.images
          if (Array.isArray(images) && images.length > 0) {
            return images[0]
          }
          if (typeof images === 'string') {
            try {
              const parsed = JSON.parse(images)
              return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder-product.jpg'
            } catch {
              return '/placeholder-product.jpg'
            }
          }
          return '/placeholder-product.jpg'
        })(),
      } : null,
    }))

    return NextResponse.json({ alerts: alertsWithProducts })
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price alerts' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/price-alerts:
 *   post:
 *     tags: [PriceAlerts]
 *     summary: Create a price alert
 *     description: Create a new price alert for a product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - targetPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               targetPrice:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Price alert created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, targetPrice } = body

    if (!productId || !targetPrice || targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid target price are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, salePrice: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const currentPrice = product.salePrice ? Number(product.salePrice) : Number(product.price)
    
    // Check if target price is lower than current price
    if (targetPrice >= currentPrice) {
      return NextResponse.json(
        { error: 'Target price must be lower than current price' },
        { status: 400 }
      )
    }

    // Create or update price alert
    const priceAlert = await prisma.priceAlert.upsert({
      where: {
        userId_productId: {
          userId: user.userId,
          productId,
        },
      },
      update: {
        targetPrice,
        isActive: true,
        triggered: false,
        triggeredAt: null,
      },
      create: {
        userId: user.userId,
        productId,
        targetPrice,
      },
    })

    return NextResponse.json({
      id: priceAlert.id,
      productId: priceAlert.productId,
      productName: product.name,
      targetPrice: Number(priceAlert.targetPrice),
      currentPrice,
      message: 'Price alert created successfully',
    })
  } catch (error) {
    console.error('Error creating price alert:', error)
    return NextResponse.json(
      { error: 'Failed to create price alert' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/price-alerts:
 *   delete:
 *     tags: [PriceAlerts]
 *     summary: Delete a price alert
 *     description: Delete a price alert by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Price alert deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Price alert not found
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Verify the alert belongs to the user
    const alert = await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId: user.userId,
      },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Price alert not found' },
        { status: 404 }
      )
    }

    await prisma.priceAlert.delete({
      where: { id: alertId },
    })

    return NextResponse.json({ message: 'Price alert deleted successfully' })
  } catch (error) {
    console.error('Error deleting price alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete price alert' },
      { status: 500 }
    )
  }
}
