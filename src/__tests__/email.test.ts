import { describe, it, expect } from 'vitest';
import {
  createOrderConfirmationEmail,
  createShippingUpdateEmail,
  createPasswordResetEmail,
  createEmailVerificationEmail,
  createDataExportReadyEmail,
  createDataExportExpiringEmail,
  createAccountDeletionConfirmationEmail,
  createVerificationStatusEmail,
  createDisputeFiledEmail,
  createDisputeRespondedEmail,
  createDisputeEscalatedEmail,
  createDisputeResolvedEmail,
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

  describe('createDataExportReadyEmail', () => {
    it('should create data export ready email with correct data', () => {
      const expiresAt = new Date('2024-12-31T23:59:59Z');
      const email = createDataExportReadyEmail(
        'user@test.com',
        'https://example.com/download/export-123',
        expiresAt,
        'json'
      );

      expect(email.to).toBe('user@test.com');
      expect(email.subject).toContain('Data Export is Ready');
      expect(email.text).toContain('JSON');
      expect(email.text).toContain('https://example.com/download/export-123');
      expect(email.html).toContain('JSON');
      expect(email.template).toBe('data_export_ready');
    });
  });

  describe('createDataExportExpiringEmail', () => {
    it('should create data export expiring email with hours remaining', () => {
      const expiresAt = new Date('2024-12-31T23:59:59Z');
      const email = createDataExportExpiringEmail(
        'user@test.com',
        'https://example.com/download/export-123',
        expiresAt,
        24
      );

      expect(email.to).toBe('user@test.com');
      expect(email.subject).toContain('24 Hours');
      expect(email.text).toContain('24 hours');
      expect(email.text).toContain('https://example.com/download/export-123');
      expect(email.template).toBe('data_export_expiring');
    });
  });

  describe('createAccountDeletionConfirmationEmail', () => {
    it('should create account deletion confirmation email', () => {
      const email = createAccountDeletionConfirmationEmail(
        'user@test.com',
        'John Doe'
      );

      expect(email.to).toBe('user@test.com');
      expect(email.subject).toContain('Account Deletion');
      expect(email.text).toContain('John Doe');
      expect(email.text).toContain('permanently deleted');
      expect(email.html).toContain('John Doe');
      expect(email.template).toBe('account_deletion_confirmation');
    });
  });

  describe('createVerificationStatusEmail', () => {
    it('should create approved verification status email', () => {
      const email = createVerificationStatusEmail(
        'vendor@test.com',
        'Test Vendor',
        'approved'
      );

      expect(email.to).toBe('vendor@test.com');
      expect(email.subject).toContain('Approved');
      expect(email.text).toContain('Test Vendor');
      expect(email.text).toContain('APPROVED');
      expect(email.template).toBe('verification_status_change');
    });

    it('should create rejected verification status email with reason', () => {
      const email = createVerificationStatusEmail(
        'vendor@test.com',
        'Test Vendor',
        'rejected',
        'Invalid documents provided'
      );

      expect(email.to).toBe('vendor@test.com');
      expect(email.subject).toContain('Verification Update');
      expect(email.text).toContain('Invalid documents provided');
      expect(email.html).toContain('Invalid documents provided');
    });
  });

  describe('createDisputeFiledEmail', () => {
    it('should create dispute filed email for vendor', () => {
      const email = createDisputeFiledEmail(
        'vendor@test.com',
        'Test Vendor',
        'dispute-123',
        'ORDER-456',
        'not_received',
        true
      );

      expect(email.to).toBe('vendor@test.com');
      expect(email.subject).toContain('New');
      expect(email.subject).toContain('ORDER-456');
      expect(email.text).toContain('Test Vendor');
      expect(email.text).toContain('dispute-123');
      expect(email.text).toContain('NOT RECEIVED');
      expect(email.template).toBe('dispute_filed');
    });

    it('should create dispute filed email for customer', () => {
      const email = createDisputeFiledEmail(
        'customer@test.com',
        'Test Customer',
        'dispute-123',
        'ORDER-456',
        'damaged',
        false
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('Your');
      expect(email.text).toContain('successfully filed');
      expect(email.text).toContain('DAMAGED');
    });
  });

  describe('createDisputeRespondedEmail', () => {
    it('should create dispute responded email', () => {
      const email = createDisputeRespondedEmail(
        'customer@test.com',
        'Test Customer',
        'dispute-123',
        'ORDER-456',
        'Test Vendor'
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('Response');
      expect(email.subject).toContain('ORDER-456');
      expect(email.text).toContain('Test Vendor');
      expect(email.text).toContain('responded');
      expect(email.template).toBe('dispute_responded');
    });
  });

  describe('createDisputeEscalatedEmail', () => {
    it('should create dispute escalated email for customer', () => {
      const email = createDisputeEscalatedEmail(
        'customer@test.com',
        'Test Customer',
        'dispute-123',
        'ORDER-456',
        false
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('Escalated');
      expect(email.text).toContain('admin review');
      expect(email.template).toBe('dispute_escalated');
    });

    it('should create dispute escalated email for admin', () => {
      const email = createDisputeEscalatedEmail(
        'admin@test.com',
        'Admin',
        'dispute-123',
        'ORDER-456',
        true
      );

      expect(email.to).toBe('admin@test.com');
      expect(email.subject).toContain('for Review');
      expect(email.text).toContain('requires admin review');
    });
  });

  describe('createDisputeResolvedEmail', () => {
    it('should create dispute resolved email in customer favor', () => {
      const email = createDisputeResolvedEmail(
        'customer@test.com',
        'Test Customer',
        'dispute-123',
        'ORDER-456',
        'Full refund approved',
        'customer_favor'
      );

      expect(email.to).toBe('customer@test.com');
      expect(email.subject).toContain('Resolved');
      expect(email.text).toContain('in your favor');
      expect(email.text).toContain('Full refund approved');
      expect(email.template).toBe('dispute_resolved');
    });

    it('should create dispute resolved email with partial refund', () => {
      const email = createDisputeResolvedEmail(
        'customer@test.com',
        'Test Customer',
        'dispute-123',
        'ORDER-456',
        'Partial refund of 50% approved',
        'partial_refund'
      );

      expect(email.text).toContain('partial refund');
      expect(email.text).toContain('Partial refund of 50% approved');
    });
  });
});

