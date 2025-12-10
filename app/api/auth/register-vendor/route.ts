import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateRefreshToken, generateRandomToken } from '@/lib/auth';
import { sendEmail, createEmailVerificationEmail } from '@/lib/email';
import { validateRequestBody, authSchemas } from '@/lib/validation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/auth/register-vendor:
 *   post:
 *     summary: Vendor registration
 *     description: Register a new vendor account with pending verification status
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
 *               - tradeLicense
 *               - tinNumber
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
 *               tradeLicense:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor registered successfully and awaiting verification
 *       400:
 *         description: User already exists or invalid input
 */
async function registerVendorHandler(request: Request): Promise<NextResponse> {
  // Validate request body
  const validation = await validateRequestBody(request, authSchemas.registerVendor);
  if (validation.success === false) {
    return validation.response;
  }
  
  const { email, password, firstName, lastName, tradeLicense, tinNumber, phone } = validation.data;

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

    // Create user with vendor role and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'vendor',
        emailVerificationToken,
        profile: {
          create: {
            displayName: email,
            firstName,
            lastName,
            phone: phone || undefined,
            isVendor: true,
            vendorStatus: 'pending',
            tradeLicense,
            tinNumber,
          },
        },
      },
      include: {
        profile: true,
      },
    });

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
      message: 'Vendor registration successful. Your account is pending admin verification. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
      token,
      refreshToken,
    }, { status: 201 });
  } catch (error) {
    // Error is caught and logged by withApiLogger wrapper
    throw error;
  }
}

// Apply rate limiting and logging middleware
export const POST = withApiLogger(
  withRateLimit(registerVendorHandler, RATE_LIMIT_CONFIGS.auth)
);
