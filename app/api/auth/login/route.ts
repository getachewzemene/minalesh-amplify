import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  isAccountLockedOut,
  shouldResetLoginAttempts,
  calculateLockoutTime
} from '@/lib/auth';
import { validateRequestBody, authSchemas } from '@/lib/validation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

async function loginHandler(request: Request) {
  // Validate request body
  const validation = await validateRequestBody(request, authSchemas.login);
  if (!validation.success) {
    return validation.response;
  }
  
  const { email, password } = validation.data;

  try {

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked out
    if (isAccountLockedOut(user.lockoutUntil)) {
      const remainingTime = Math.ceil((user.lockoutUntil!.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Please try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }

    // Reset login attempts if lockout period has passed
    if (shouldResetLoginAttempts(user.loginAttempts, user.lockoutUntil)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
      user.loginAttempts = 0;
      user.lockoutUntil = null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      const updateData: any = { loginAttempts: newAttempts };

      // Lock account if max attempts reached
      if (newAttempts >= 5) {
        updateData.lockoutUntil = calculateLockoutTime();
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (newAttempts >= 5) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Account locked for 15 minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid credentials', attemptsRemaining: 5 - newAttempts },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockoutUntil: null },
    });

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
      message: 'Login successful',
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
  withRateLimit(loginHandler, RATE_LIMIT_CONFIGS.auth)
);
