import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const supportTicketSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  category: z.enum([
    'order_inquiry',
    'shipping_issue',
    'refund_request',
    'product_question',
    'vendor_support',
    'technical_issue',
    'account_help',
    'other',
  ]),
  subject: z.string().min(5),
  message: z.string().min(20),
  orderNumber: z.string().optional(),
})

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Submit a support ticket
 *     description: Create a new support ticket for customer inquiries
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - category
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+251-XXX-XXXX"
 *               category:
 *                 type: string
 *                 enum: [order_inquiry, shipping_issue, refund_request, product_question, vendor_support, technical_issue, account_help, other]
 *               subject:
 *                 type: string
 *                 example: Order not received
 *               message:
 *                 type: string
 *                 example: I placed an order 5 days ago but haven't received it yet
 *               orderNumber:
 *                 type: string
 *                 example: ORD-123456
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = supportTicketSchema.parse(body)

    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // In a real implementation, you would:
    // 1. Store the ticket in database
    // 2. Send confirmation email to the user
    // 3. Notify support team
    // 4. Create a support ticket in your helpdesk system

    // For now, we'll log it and send a success response
    logger.info({
      ticketId,
      category: validatedData.category,
      email: validatedData.email,
      subject: validatedData.subject,
    }, 'Support ticket created')

    // TODO: Store in database when support ticket model is added
    // TODO: Send confirmation email via Resend

    return NextResponse.json(
      {
        success: true,
        ticketId,
        message: 'Support ticket submitted successfully. We will respond within 24-48 hours.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    logger.error({ error }, 'Error creating support ticket')
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit support ticket. Please try again.',
      },
      { status: 500 }
    )
  }
}
