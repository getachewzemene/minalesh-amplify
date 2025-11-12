import { describe, it, expect } from 'vitest';
import {
  createOrderConfirmationEmail,
  createShippingUpdateEmail,
  createPasswordResetEmail,
  createEmailVerificationEmail,
} from '@/lib/email';

describe('Email Templates', () => {
  describe('createOrderConfirmationEmail', () => {
    it('should create order confirmation email with correct data', () => {
      const orderItems = [
        { name: 'Product 1', quantity: 2, price: 100 },
        { name: 'Product 2', quantity: 1, price: 50 },
      ];

      const email = createOrderConfirmationEmail(
        'customer@test.com',
        'MIN-12345',
        '250.00',
        orderItems
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('MIN-12345');
      expect(email.text).toContain('MIN-12345');
      expect(email.text).toContain('250.00 ETB');
      expect(email.text).toContain('Product 1');
      expect(email.text).toContain('Product 2');
      expect(email.html).toContain('MIN-12345');
      expect(email.html).toContain('250.00 ETB');
    });
  });

  describe('createShippingUpdateEmail', () => {
    it('should create shipping update email without tracking', () => {
      const email = createShippingUpdateEmail(
        'customer@test.com',
        'MIN-12345',
        'shipped'
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('MIN-12345');
      expect(email.text).toContain('MIN-12345');
      expect(email.text).toContain('shipped');
      expect(email.text).not.toContain('Tracking Number');
    });

    it('should create shipping update email with tracking', () => {
      const email = createShippingUpdateEmail(
        'customer@test.com',
        'MIN-12345',
        'shipped',
        'TRACK-12345'
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('MIN-12345');
      expect(email.text).toContain('TRACK-12345');
      expect(email.html).toContain('TRACK-12345');
    });
  });

  describe('createPasswordResetEmail', () => {
    it('should create password reset email with token', () => {
      const email = createPasswordResetEmail(
        'user@test.com',
        'reset-token-123',
        'http://localhost:3000'
      );

      expect(email.to).toBe('user@test.com');
      expect(email.subject).toContain('Password Reset');
      expect(email.text).toContain('reset-token-123');
      expect(email.text).toContain('http://localhost:3000/auth/reset-password?token=reset-token-123');
      expect(email.html).toContain('reset-token-123');
      expect(email.html).toContain('1 hour');
    });
  });

  describe('createEmailVerificationEmail', () => {
    it('should create email verification email with token', () => {
      const email = createEmailVerificationEmail(
        'user@test.com',
        'verify-token-123',
        'http://localhost:3000'
      );

      expect(email.to).toBe('user@test.com');
      expect(email.subject).toContain('Verify');
      expect(email.text).toContain('verify-token-123');
      expect(email.text).toContain('http://localhost:3000/auth/verify-email?token=verify-token-123');
      expect(email.html).toContain('verify-token-123');
      expect(email.html).toContain('24 hours');
    });
  });
});
