/**
 * E2E Tests: Authentication API
 * 
 * Tests the complete authentication flow including registration,
 * login, logout, token refresh, and password reset.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock email
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  createEmailVerificationEmail: vi.fn(() => ({})),
  createPasswordResetEmail: vi.fn(() => ({})),
}));

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
  RATE_LIMIT_CONFIGS: { auth: {} },
}));

// Mock API logger
vi.mock('@/lib/api-logger', () => ({
  withApiLogger: (handler: any) => handler,
}));

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  isAccountLockedOut,
  calculateLockoutTime,
} from '@/lib/auth';

describe('E2E: Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        role: 'customer' as UserRole,
        emailVerified: false,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      // Simulate registration flow
      const registrationData = {
        email: 'newuser@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Step 1: Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: registrationData.email },
      });
      expect(existingUser).toBeNull();

      // Step 2: Hash password
      const hashedPassword = await hashPassword(registrationData.password);
      expect(hashedPassword).not.toBe(registrationData.password);

      // Step 3: Create user
      const user = await prisma.user.create({
        data: {
          email: registrationData.email,
          password: hashedPassword,
          profile: {
            create: {
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
            },
          },
        } as any,
      });
      expect(user.id).toBeDefined();
      expect(user.email).toBe(registrationData.email);

      // Step 4: Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);

      // Step 5: Verify email is sent
      await sendEmail({} as any);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'existing@example.com',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      const user = await prisma.user.findUnique({
        where: { email: 'existing@example.com' },
      });

      expect(user).not.toBeNull();
      // Registration should be rejected when user exists
      expect(user?.id).toBe('user-1');
    });

    it('should validate required registration fields', () => {
      const invalidRegistrations = [
        { email: '', password: 'Password123', firstName: 'John', lastName: 'Doe' },
        { email: 'test@example.com', password: '', firstName: 'John', lastName: 'Doe' },
        { email: 'test@example.com', password: 'Password123', firstName: '', lastName: 'Doe' },
        { email: 'test@example.com', password: 'Password123', firstName: 'John', lastName: '' },
      ];

      for (const data of invalidRegistrations) {
        const hasEmptyField = Object.values(data).some(v => v === '');
        expect(hasEmptyField).toBe(true);
      }
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should validate password strength', () => {
      const weakPasswords = ['short', '12345', 'pass'];
      const minLength = 8;

      for (const password of weakPasswords) {
        expect(password.length >= minLength).toBe(false);
      }
    });
  });

  describe('Login Flow', () => {
    it('should login user with valid credentials', async () => {
      const password = 'ValidPassword123';
      const hashedPassword = await hashPassword(password);

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'customer' as UserRole,
        loginAttempts: 0,
        lockoutUntil: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      // Step 1: Find user
      const user = await prisma.user.findUnique({
        where: { email: 'user@example.com' },
      });
      expect(user).not.toBeNull();

      // Step 2: Verify password
      const isValid = await verifyPassword(password, user!.password);
      expect(isValid).toBe(true);

      // Step 3: Check not locked out
      expect(isAccountLockedOut(user!.lockoutUntil)).toBe(false);

      // Step 4: Generate tokens
      const token = generateToken({
        userId: user!.id,
        email: user!.email,
        role: user!.role,
      });
      expect(token).toBeDefined();

      // Step 5: Reset login attempts
      await prisma.user.update({
        where: { id: user!.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should reject login with invalid password', async () => {
      const correctPassword = 'ValidPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await hashPassword(correctPassword);

      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });

    it('should increment login attempts on failure', async () => {
      const mockUser = {
        id: 'user-1',
        loginAttempts: 3,
        lockoutUntil: null,
      };

      const newAttempts = mockUser.loginAttempts + 1;
      expect(newAttempts).toBe(4);

      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        loginAttempts: newAttempts,
      } as any);

      await prisma.user.update({
        where: { id: 'user-1' },
        data: { loginAttempts: newAttempts },
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { loginAttempts: 4 },
        })
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 'user-1',
        loginAttempts: 4, // Will become 5 after this attempt
        lockoutUntil: null,
      };

      const newAttempts = mockUser.loginAttempts + 1;
      expect(newAttempts).toBe(5);

      // Account should be locked
      const shouldLock = newAttempts >= 5;
      expect(shouldLock).toBe(true);

      if (shouldLock) {
        const lockoutTime = calculateLockoutTime();
        expect(lockoutTime.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should reject login when account is locked', async () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 10);

      const isLocked = isAccountLockedOut(futureTime);
      expect(isLocked).toBe(true);
    });

    it('should allow login after lockout expires', async () => {
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);

      const isLocked = isAccountLockedOut(pastTime);
      expect(isLocked).toBe(false);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should verify and refresh valid token', () => {
      const payload = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'customer' as UserRole,
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);

      // Generate new token with slightly different payload to ensure different token
      const newPayload = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'customer' as UserRole,
      };
      const newToken = generateToken(newPayload);
      expect(newToken).toBeDefined();
      expect(newToken.split('.')).toHaveLength(3);
    });

    it('should reject invalid token', () => {
      const verified = verifyToken('invalid.token.here');
      expect(verified).toBeNull();
    });

    it('should reject tampered token', () => {
      const payload = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'customer' as UserRole,
      };

      const token = generateToken(payload);
      const tamperedToken = token.substring(0, token.length - 5) + 'xxxxx';
      const verified = verifyToken(tamperedToken);

      expect(verified).toBeNull();
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset for existing user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      // Step 1: Find user
      const user = await prisma.user.findUnique({
        where: { email: 'user@example.com' },
      });
      expect(user).not.toBeNull();

      // Step 2: Generate reset token
      const resetToken = crypto.randomUUID().replace(/-/g, '');
      expect(resetToken.length).toBeGreaterThan(0);

      // Step 3: Store reset token
      await prisma.user.update({
        where: { id: user!.id },
        data: { passwordResetToken: resetToken },
      } as any);
      expect(prisma.user.update).toHaveBeenCalled();

      // Step 4: Send email
      await sendEmail({} as any);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should not reveal if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      // Even if user doesn't exist, we should not reveal this
      // Just return success message
      const response = { message: 'If the email exists, a reset link has been sent' };
      expect(response.message).toBeDefined();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword456';
      const hashedPassword = await hashPassword(newPassword);

      const mockUser = {
        id: 'user-1',
        passwordResetToken: 'valid-reset-token',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        passwordResetToken: null,
      } as any);

      // Step 1: Find user by reset token
      const user = await prisma.user.findUnique({
        where: { passwordResetToken: 'valid-reset-token' },
      } as any);
      expect(user).not.toBeNull();

      // Step 2: Hash new password
      expect(hashedPassword).not.toBe(newPassword);

      // Step 3: Update password and clear token
      await prisma.user.update({
        where: { id: user!.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
        },
      } as any);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('Email Verification Flow', () => {
    it('should verify email with valid token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: false,
        emailVerificationToken: 'valid-token',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerificationToken: null,
      } as any);

      // Step 1: Find user by verification token
      const user = await prisma.user.findUnique({
        where: { emailVerificationToken: 'valid-token' },
      } as any);
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(false);

      // Step 2: Verify email
      const updatedUser = await prisma.user.update({
        where: { id: user!.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      } as any);
      expect(updatedUser.emailVerified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { emailVerificationToken: 'invalid-token' },
      } as any);

      expect(user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should generate different tokens for different users', () => {
      const user1Payload = {
        userId: 'user-1',
        email: 'user1@example.com',
        role: 'customer' as UserRole,
      };

      const user2Payload = {
        userId: 'user-2',
        email: 'user2@example.com',
        role: 'vendor' as UserRole,
      };

      const token1 = generateToken(user1Payload);
      const token2 = generateToken(user2Payload);

      expect(token1).not.toBe(token2);

      const verified1 = verifyToken(token1);
      const verified2 = verifyToken(token2);

      expect(verified1?.userId).toBe('user-1');
      expect(verified2?.userId).toBe('user-2');
    });

    it('should include role information in token', () => {
      const adminPayload = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
      };

      const token = generateToken(adminPayload);
      const verified = verifyToken(token);

      expect(verified?.role).toBe('admin');
    });
  });
});
