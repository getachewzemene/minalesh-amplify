import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateRefreshToken, generateRandomToken } from '@/lib/auth';
import { sendEmail, createEmailVerificationEmail } from '@/lib/email';
import { validateRequestBody, authSchemas } from '@/lib/validation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';
import { awardPoints, POINTS_RATES } from '@/lib/loyalty/points';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or invalid input
 */
async function registerHandler(request: Request): Promise<NextResponse> {
  // Validate request body
  const validation = await validateRequestBody(request, authSchemas.register);
  if (validation.success === false) {
    return validation.response;
  }
  
  const { email, password, firstName, lastName, referralCode } = validation.data;

  try {

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();

    // Validate referral code if provided
    let referralData = null;
    if (referralCode) {
      referralData = await prisma.referral.findUnique({
        where: { 
          code: referralCode.toUpperCase(),
        },
      });

      // Validate referral code
      if (!referralData) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }

      if (referralData.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Referral code has expired' },
          { status: 400 }
        );
      }

      if (referralData.status !== 'pending') {
        return NextResponse.json(
          { error: 'Referral code has already been used' },
          { status: 400 }
        );
      }
    }

    // Create user and profile
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerificationToken,
          profile: {
            create: {
              displayName: email,
              firstName,
              lastName,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // If referral code was provided, update referral status
      if (referralData) {
        await tx.referral.update({
          where: { id: referralData.id },
          data: {
            refereeId: newUser.id,
            status: 'registered',
          },
        });
      }

      return newUser;
    });

    // Award welcome points to new user (referee) - done outside transaction to avoid nested transactions
    if (referralData) {
      try {
        await awardPoints(
          user.id,
          POINTS_RATES.referralReferee,
          'referral',
          'Welcome bonus for signing up with a referral code',
          referralData.id
        );
      } catch (error) {
        console.error('Error awarding referral points to referee:', error);
        // Don't fail registration if points award fails
      }
    }

    // Send email verification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailTemplate = createEmailVerificationEmail(user.email, emailVerificationToken, appUrl);
    await sendEmail(emailTemplate);

    // Generate JWT tokens
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    });
    const refreshToken = generateRefreshToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    // Error is caught and logged by withApiLogger wrapper
    throw error;
  }
}

// Apply rate limiting and logging middleware
export const POST = withApiLogger(
  withRateLimit(registerHandler, RATE_LIMIT_CONFIGS.auth)
);
