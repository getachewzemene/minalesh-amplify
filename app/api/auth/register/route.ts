import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateRefreshToken, generateRandomToken } from '@/lib/auth';
import { sendEmail, createEmailVerificationEmail } from '@/lib/email';
import { validateRequestBody, authSchemas } from '@/lib/validation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

async function registerHandler(request: Request): Promise<NextResponse> {
  // Validate request body
  const validation = await validateRequestBody(request, authSchemas.register);
  if (validation.success === false) {
    return validation.response;
  }
  
  const { email, password, firstName, lastName } = validation.data;

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

    // Create user and profile
    const user = await prisma.user.create({
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
