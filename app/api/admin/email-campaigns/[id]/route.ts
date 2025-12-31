import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth'

/**
 * @swagger
 * /api/admin/email-campaigns/{id}:
 *   get:
 *     tags: [Admin, Email Marketing]
 *     summary: Get campaign details
 *     description: Retrieve details of a specific email campaign
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
 *         description: Campaign details retrieved
 *       404:
 *         description: Campaign not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/email-campaigns/{id}:
 *   patch:
 *     tags: [Admin, Email Marketing]
 *     summary: Update campaign
 *     description: Update an email campaign (only if draft or scheduled)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campaign updated
 *       400:
 *         description: Cannot update sent campaign
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Prevent editing sent campaigns
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot edit a campaign that is sent or currently sending' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const updated = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/email-campaigns/{id}:
 *   delete:
 *     tags: [Admin, Email Marketing]
 *     summary: Delete campaign
 *     description: Delete an email campaign (only if draft)
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
 *         description: Campaign deleted
 *       400:
 *         description: Cannot delete non-draft campaign
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req)
    const payload = getUserFromToken(token)

    if (!payload || !isAdmin(payload.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft campaigns
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft campaigns' },
        { status: 400 }
      )
    }

    await prisma.emailCampaign.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
