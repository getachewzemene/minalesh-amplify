import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'
import { queueEmail } from '@/lib/email'

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

function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = []
  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

/**
 * @swagger
 * /api/gift-cards/purchase:
 *   post:
 *     tags: [GiftCards]
 *     summary: Purchase a gift card
 *     description: Purchase a gift card for yourself or someone else
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Gift card amount in ETB
 *                 minimum: 50
 *                 maximum: 10000
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: Recipient's email address
 *               message:
 *                 type: string
 *                 description: Personal message for the recipient
 *     responses:
 *       200:
 *         description: Gift card purchased successfully
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
    const { amount, recipientEmail, message } = body

    if (!amount || amount < 50 || amount > 10000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 50 and 10,000 ETB' },
        { status: 400 }
      )
    }

    // Find recipient by email if provided
    let recipientId = null
    if (recipientEmail) {
      const recipient = await prisma.user.findUnique({
        where: { email: recipientEmail },
      })
      recipientId = recipient?.id || null
    }

    // Generate unique code
    let code = generateGiftCardCode()
    let existingCard = await prisma.giftCard.findUnique({
      where: { code },
    })
    
    let attempts = 0
    const MAX_ATTEMPTS = 10
    
    while (existingCard && attempts < MAX_ATTEMPTS) {
      code = generateGiftCardCode()
      existingCard = await prisma.giftCard.findUnique({
        where: { code },
      })
      attempts++
    }
    
    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Failed to generate unique gift card code. Please try again.' },
        { status: 500 }
      )
    }

    // Gift cards expire in 1 year
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Create gift card
    const giftCard = await prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.create({
        data: {
          code,
          purchaserId: user.userId,
          recipientId,
          recipientEmail,
          amount,
          balance: amount,
          message,
          expiresAt,
        },
      })

      // Create transaction record
      await tx.giftCardTransaction.create({
        data: {
          cardId: card.id,
          amount,
          type: 'purchase',
        },
      })

      return card
    })

    // Send email to recipient if recipientEmail is provided
    if (recipientEmail) {
      try {
        const purchaserName = user.email.split('@')[0] // Fallback to email username
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .gift-card { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
                .code { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; margin: 10px 0; }
                .amount { font-size: 32px; font-weight: bold; color: #333; margin: 10px 0; }
                .message-box { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎁 You've Received a Gift Card!</h1>
                </div>
                <div class="content">
                  <p>Hello!</p>
                  <p>Great news! <strong>${purchaserName}</strong> has sent you a gift card for Minalesh.</p>
                  ${message ? `
                    <div class="message-box">
                      <strong>Personal Message:</strong><br>
                      "${message}"
                    </div>
                  ` : ''}
                  <div class="gift-card">
                    <p style="margin: 0; color: #666;">Gift Card Value</p>
                    <div class="amount">${amount} ETB</div>
                    <p style="margin: 10px 0; color: #666;">Gift Card Code</p>
                    <div class="code">${code}</div>
                    <p style="margin: 10px 0; color: #999; font-size: 12px;">Valid until ${new Date(expiresAt).toLocaleDateString()}</p>
                  </div>
                  <p><strong>How to use your gift card:</strong></p>
                  <ol>
                    <li>Shop on Minalesh and add items to your cart</li>
                    <li>At checkout, enter your gift card code</li>
                    <li>The gift card balance will be applied to your order</li>
                  </ol>
                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://minalesh.et'}" class="button">Start Shopping</a>
                  </div>
                  <p style="margin-top: 20px; color: #666; font-size: 12px;">
                    <strong>Note:</strong> Gift cards can be used multiple times until the balance is depleted. They expire one year from the purchase date.
                  </p>
                </div>
                <div class="footer">
                  <p>This email was sent from Minalesh. If you have any questions, please contact our support team.</p>
                  <p>&copy; ${new Date().getFullYear()} Minalesh. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `
        
        const emailText = `
You've Received a Gift Card!

${purchaserName} has sent you a gift card for Minalesh.

${message ? `Personal Message: "${message}"` : ''}

Gift Card Details:
- Amount: ${amount} ETB
- Code: ${code}
- Valid Until: ${new Date(expiresAt).toLocaleDateString()}

How to use:
1. Shop on Minalesh and add items to your cart
2. At checkout, enter your gift card code: ${code}
3. The balance will be applied to your order

Start shopping: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://minalesh.et'}

Gift cards can be used multiple times until the balance is depleted.
        `

        await queueEmail({
          to: recipientEmail,
          subject: `🎁 You've received a ${amount} ETB gift card from ${purchaserName}!`,
          html: emailHtml,
          text: emailText,
          template: 'gift_card',
          metadata: {
            giftCardId: giftCard.id,
            code: giftCard.code,
            amount: giftCard.amount,
          },
        })
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Error queueing gift card email:', emailError)
      }
    }

    return NextResponse.json({
      id: giftCard.id,
      code: giftCard.code,
      amount: giftCard.amount,
      balance: giftCard.balance,
      expiresAt: giftCard.expiresAt,
      message: 'Gift card purchased successfully',
    })
  } catch (error) {
    console.error('Error purchasing gift card:', error)
    return NextResponse.json(
      { error: 'Failed to purchase gift card' },
      { status: 500 }
    )
  }
}
