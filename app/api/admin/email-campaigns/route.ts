import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth'

/**
 * @swagger
 * /api/admin/email-campaigns:
 *   get:
 *     tags: [Admin, Email Marketing]
 *     summary: List all email campaigns
 *     description: Get all email campaigns with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sending, sent, paused, cancelled]
 *         description: Filter by campaign status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [promotional, transactional, newsletter, abandoned_cart, welcome_series, reengagement]
 *         description: Filter by campaign type
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
 *         description: Campaigns retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')
    const skip = (page - 1) * perPage

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.emailCampaign.count({ where }),
    ])

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Error fetching email campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email campaigns' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/email-campaigns:
 *   post:
 *     tags: [Admin, Email Marketing]
 *     summary: Create a new email campaign
 *     description: Create a new email marketing campaign
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
 *               - subject
 *               - htmlContent
 *               - textContent
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               previewText:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               textContent:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [promotional, transactional, newsletter, abandoned_cart, welcome_series, reengagement]
 *               templateId:
 *                 type: string
 *               segmentCriteria:
 *                 type: object
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      name,
      subject,
      previewText,
      htmlContent,
      textContent,
      type,
      templateId,
      segmentCriteria,
      scheduledFor,
    } = body

    // Validation
    if (!name || !subject || !htmlContent || !textContent || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validTypes = ['promotional', 'transactional', 'newsletter', 'abandoned_cart', 'welcome_series', 'reengagement']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid campaign type' },
        { status: 400 }
      )
    }

    // Determine initial status
    let status: 'draft' | 'scheduled' = 'draft'
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      status = 'scheduled'
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        previewText,
        htmlContent,
        textContent,
        type,
        status,
        templateId,
        segmentCriteria,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdBy: payload.userId,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating email campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create email campaign' },
      { status: 500 }
    )
  }
}
