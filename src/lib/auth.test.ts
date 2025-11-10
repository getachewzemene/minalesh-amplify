import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, isAdmin } from './auth';

describe('Auth utilities', () => {
  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test123';
      const wrongPassword = 'wrong';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT token handling', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify and decode a valid token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('Admin check', () => {
    it('should return false for non-admin email', () => {
      const result = isAdmin('user@example.com');
      expect(result).toBe(false);
    });

    it('should handle case-insensitive comparison', () => {
      // Without ADMIN_EMAILS env var, should return false
      const result = isAdmin('ADMIN@EXAMPLE.COM');
      expect(result).toBe(false);
    });
  });
});
