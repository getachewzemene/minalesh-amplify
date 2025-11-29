/**
 * Unit Tests: Authentication Module
 * 
 * Tests for password hashing, JWT token generation/verification,
 * role checking, and other authentication utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  getTokenFromRequest,
  getUserFromToken,
  hasRole,
  isAdmin,
  isVendor,
  isCustomer,
  generateRandomToken,
} from '@/lib/auth';
import { UserRole } from '@prisma/client';

describe('Authentication Module', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
      expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should differ
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#%^&*()';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = '密码123αβγ';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    const testPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'customer' as UserRole,
    };

    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { ...testPayload, userId: 'user-1' };
      const payload2 = { ...testPayload, userId: 'user-2' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with different roles', () => {
      const customerPayload = { ...testPayload, role: 'customer' as UserRole };
      const vendorPayload = { ...testPayload, role: 'vendor' as UserRole };
      const adminPayload = { ...testPayload, role: 'admin' as UserRole };

      const customerToken = generateToken(customerPayload);
      const vendorToken = generateToken(vendorPayload);
      const adminToken = generateToken(adminPayload);

      expect(customerToken).not.toBe(vendorToken);
      expect(vendorToken).not.toBe(adminToken);
      expect(customerToken).not.toBe(adminToken);
    });
  });

  describe('JWT Token Verification', () => {
    const testPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'customer' as UserRole,
    };

    it('should verify a valid token', () => {
      const token = generateToken(testPayload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(testPayload.userId);
      expect(verified?.email).toBe(testPayload.email);
      expect(verified?.role).toBe(testPayload.role);
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should reject a tampered token', () => {
      const token = generateToken(testPayload);
      const tamperedToken = token.substring(0, token.length - 5) + 'xxxxx';
      const verified = verifyToken(tamperedToken);

      expect(verified).toBeNull();
    });

    it('should reject empty token', () => {
      const verified = verifyToken('');

      expect(verified).toBeNull();
    });

    it('should verify refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const verified = verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(testPayload.userId);
    });
  });

  describe('Token Extraction from Request', () => {
    it('should extract token from valid authorization header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => name === 'authorization' ? 'Bearer valid-token-123' : null,
        },
      } as unknown as Request;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBe('valid-token-123');
    });

    it('should return null for missing authorization header', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as Request;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer authorization', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => name === 'authorization' ? 'Basic base64credentials' : null,
        },
      } as unknown as Request;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null for empty authorization header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => name === 'authorization' ? '' : null,
        },
      } as unknown as Request;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });

    it('should handle Bearer with extra spaces', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => name === 'authorization' ? 'Bearer   token-with-spaces' : null,
        },
      } as unknown as Request;

      const token = getTokenFromRequest(mockRequest);
      expect(token).toBe('  token-with-spaces');
    });
  });

  describe('getUserFromToken', () => {
    const testPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'customer' as UserRole,
    };

    it('should return payload for valid token', () => {
      const token = generateToken(testPayload);
      const user = getUserFromToken(token);

      expect(user).not.toBeNull();
      expect(user?.userId).toBe(testPayload.userId);
      expect(user?.email).toBe(testPayload.email);
    });

    it('should return null for null token', () => {
      const user = getUserFromToken(null);
      expect(user).toBeNull();
    });

    it('should return null for invalid token', () => {
      const user = getUserFromToken('invalid-token');
      expect(user).toBeNull();
    });
  });

  describe('Role Checking', () => {
    describe('hasRole', () => {
      it('should return true for matching single role', () => {
        expect(hasRole('admin' as UserRole, 'admin' as UserRole)).toBe(true);
        expect(hasRole('vendor' as UserRole, 'vendor' as UserRole)).toBe(true);
        expect(hasRole('customer' as UserRole, 'customer' as UserRole)).toBe(true);
      });

      it('should return false for non-matching single role', () => {
        expect(hasRole('customer' as UserRole, 'admin' as UserRole)).toBe(false);
        expect(hasRole('vendor' as UserRole, 'admin' as UserRole)).toBe(false);
        expect(hasRole('customer' as UserRole, 'vendor' as UserRole)).toBe(false);
      });

      it('should return true for role in array', () => {
        expect(hasRole('admin' as UserRole, ['admin', 'vendor'] as UserRole[])).toBe(true);
        expect(hasRole('vendor' as UserRole, ['admin', 'vendor'] as UserRole[])).toBe(true);
      });

      it('should return false for role not in array', () => {
        expect(hasRole('customer' as UserRole, ['admin', 'vendor'] as UserRole[])).toBe(false);
      });
    });

    describe('isAdmin', () => {
      it('should return true for admin role', () => {
        expect(isAdmin('admin' as UserRole)).toBe(true);
      });

      it('should return false for non-admin roles', () => {
        expect(isAdmin('vendor' as UserRole)).toBe(false);
        expect(isAdmin('customer' as UserRole)).toBe(false);
      });
    });

    describe('isVendor', () => {
      it('should return true for vendor role', () => {
        expect(isVendor('vendor' as UserRole)).toBe(true);
      });

      it('should return true for admin role', () => {
        expect(isVendor('admin' as UserRole)).toBe(true);
      });

      it('should return false for customer role', () => {
        expect(isVendor('customer' as UserRole)).toBe(false);
      });
    });

    describe('isCustomer', () => {
      it('should return true for customer role', () => {
        expect(isCustomer('customer' as UserRole)).toBe(true);
      });

      it('should return true for vendor role', () => {
        expect(isCustomer('vendor' as UserRole)).toBe(true);
      });

      it('should return true for admin role', () => {
        expect(isCustomer('admin' as UserRole)).toBe(true);
      });
    });
  });

  describe('Random Token Generation', () => {
    it('should generate a non-empty token', () => {
      const token = generateRandomToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens on each call', () => {
      const token1 = generateRandomToken();
      const token2 = generateRandomToken();
      const token3 = generateRandomToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate tokens without hyphens', () => {
      const token = generateRandomToken();

      expect(token).not.toContain('-');
    });

    it('should generate tokens of consistent length', () => {
      const tokens = Array.from({ length: 10 }, () => generateRandomToken());
      const lengths = tokens.map(t => t.length);
      const uniqueLengths = [...new Set(lengths)];

      // All tokens should have the same length
      expect(uniqueLengths.length).toBe(1);
    });
  });
});
