import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * @swagger
 * /api/products/{id}/share:
 *   post:
 *     summary: Track product share
 *     description: Track when a user shares a product on social media
 *     tags: [Products, Social Sharing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, facebook, twitter, telegram, copy_link, qr_code, native]
 *                 description: Social platform used for sharing
 *     responses:
 *       200:
 *         description: Share tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 shareId:
 *                   type: string
 *       400:
 *         description: Invalid platform
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params
    const body = await request.json()
    const { platform } = body

    // Validate platform
    const validPlatforms = ['whatsapp', 'facebook', 'twitter', 'telegram', 'copy_link', 'qr_code', 'native']
    if (!platform || !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be one of: ' + validPlatforms.join(', ') },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get user ID if logged in (optional)
    let userId: string | null = null
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      if (token) {
        const decoded = await verifyToken(token)
        userId = decoded.userId
      }
    } catch (error) {
      // User is not logged in, which is fine
      userId = null
    }

    // Get user agent and IP address for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      undefined

    // Track the share
    const share = await prisma.productShare.create({
      data: {
        productId,
        userId,
        platform,
        userAgent,
        ipAddress
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Share tracked successfully',
      shareId: share.id
    })
  } catch (error) {
    console.error('Error tracking product share:', error)
    return NextResponse.json(
      { error: 'Failed to track share' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/products/{id}/share:
 *   get:
 *     summary: Get product share statistics
 *     description: Retrieve share count and statistics for a product
 *     tags: [Products, Social Sharing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Share statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalShares:
 *                   type: number
 *                   description: Total number of shares
 *                 byPlatform:
 *                   type: object
 *                   properties:
 *                     whatsapp:
 *                       type: number
 *                     facebook:
 *                       type: number
 *                     twitter:
 *                       type: number
 *                     telegram:
 *                       type: number
 *                     copy_link:
 *                       type: number
 *                     qr_code:
 *                       type: number
 *                     native:
 *                       type: number
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get total shares
    const totalShares = await prisma.productShare.count({
      where: { productId }
    })

    // Get shares by platform
    const sharesByPlatform = await prisma.productShare.groupBy({
      by: ['platform'],
      where: { productId },
      _count: {
        platform: true
      }
    })

    // Format the response
    const byPlatform: Record<string, number> = {
      whatsapp: 0,
      facebook: 0,
      twitter: 0,
      telegram: 0,
      copy_link: 0,
      qr_code: 0,
      native: 0
    }

    sharesByPlatform.forEach((item) => {
      byPlatform[item.platform] = item._count.platform
    })

    return NextResponse.json({
      totalShares,
      byPlatform
    })
  } catch (error) {
    console.error('Error fetching share statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share statistics' },
      { status: 500 }
    )
  }
}
