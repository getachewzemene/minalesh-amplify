import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth'

/**
 * @swagger
 * /api/admin/email-campaigns/{id}/send:
 *   post:
 *     tags: [Admin, Email Marketing]
 *     summary: Send or schedule campaign
 *     description: Send an email campaign immediately or schedule it for later
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
 *             properties:
 *               sendNow:
 *                 type: boolean
 *                 description: Send immediately (true) or schedule (false)
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule time if sendNow is false
 *     responses:
 *       200:
 *         description: Campaign queued or scheduled
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Campaign not found
 */
export async function POST(
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

    // Check if campaign can be sent
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Campaign already sent or sending' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { sendNow, scheduledFor } = body

    if (sendNow) {
      // Queue emails for immediate sending
      await queueCampaignEmails(campaign.id)
      
      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: {
          status: 'sending',
          sentAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Campaign is being sent',
        status: 'sending',
      })
    } else {
      // Schedule for later
      if (!scheduledFor) {
        return NextResponse.json(
          { error: 'scheduledFor is required when sendNow is false' },
          { status: 400 }
        )
      }

      const scheduledDate = new Date(scheduledFor)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }

      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: {
          status: 'scheduled',
          scheduledFor: scheduledDate,
        },
      })

      return NextResponse.json({
        message: 'Campaign scheduled successfully',
        status: 'scheduled',
        scheduledFor: scheduledDate,
      })
    }
  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

// Helper function to queue campaign emails
async function queueCampaignEmails(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Get target recipients based on segment criteria
  const recipients = await getTargetRecipients(campaign.segmentCriteria)

  // Update campaign total recipients
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { totalRecipients: recipients.length },
  })

  // Queue emails
  const emailPromises = recipients.map((email: string) =>
    prisma.emailQueue.create({
      data: {
        to: email,
        subject: campaign.subject,
        html: campaign.htmlContent,
        text: campaign.textContent,
        template: campaign.templateId || 'campaign',
        metadata: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'campaign',
        },
        status: 'pending',
      },
    })
  )

  await Promise.all(emailPromises)
}

// Helper function to get target recipients
async function getTargetRecipients(segmentCriteria: any): Promise<string[]> {
  // If no criteria, send to all subscribed users
  if (!segmentCriteria || Object.keys(segmentCriteria).length === 0) {
    const subscriptions = await prisma.emailSubscription.findMany({
      where: { isSubscribed: true },
      select: { email: true },
    })
    return subscriptions.map(s => s.email)
  }

  // Build query based on criteria
  const where: any = {}
  
  if (segmentCriteria.hasOrders) {
    // Users who have placed orders
    const usersWithOrders = await prisma.user.findMany({
      where: {
        orders: {
          some: {},
        },
        emailSubscriptions: {
          some: {
            isSubscribed: true,
          },
        },
      },
      select: { email: true },
    })
    return usersWithOrders.map(u => u.email)
  }

  if (segmentCriteria.loyaltyTier) {
    // Users in specific loyalty tier
    const users = await prisma.user.findMany({
      where: {
        loyaltyAccount: {
          tier: segmentCriteria.loyaltyTier,
        },
        emailSubscriptions: {
          some: {
            isSubscribed: true,
          },
        },
      },
      select: { email: true },
    })
    return users.map(u => u.email)
  }

  // Default: all subscribed users
  const subscriptions = await prisma.emailSubscription.findMany({
    where: { isSubscribed: true },
    select: { email: true },
  })
  return subscriptions.map(s => s.email)
}
