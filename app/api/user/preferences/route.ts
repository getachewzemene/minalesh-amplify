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
 * /api/user/preferences:
 *   get:
 *     tags: [User]
 *     summary: Get user preferences
 *     description: Retrieve current user's preferences including language and notification settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.userId },
    })

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        language: 'en',
        currency: 'ETB',
        emailMarketing: true,
        smsMarketing: false,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/user/preferences:
 *   patch:
 *     tags: [User]
 *     summary: Update user preferences
 *     description: Update current user's preferences (language, currency, notifications)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, am, om, ti]
 *                 description: User's preferred language
 *               currency:
 *                 type: string
 *                 default: ETB
 *               emailMarketing:
 *                 type: boolean
 *               smsMarketing:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { language, currency, emailMarketing, smsMarketing } = body

    // Validate language if provided
    if (language && !['en', 'am', 'om', 'ti'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      )
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.userId },
      update: {
        ...(language && { language }),
        ...(currency && { currency }),
        ...(typeof emailMarketing === 'boolean' && { emailMarketing }),
        ...(typeof smsMarketing === 'boolean' && { smsMarketing }),
      },
      create: {
        userId: user.userId,
        language: language || 'en',
        currency: currency || 'ETB',
        emailMarketing: emailMarketing ?? true,
        smsMarketing: smsMarketing ?? false,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
