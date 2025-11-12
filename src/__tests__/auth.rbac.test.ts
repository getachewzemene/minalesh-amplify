import { describe, it, expect } from 'vitest';
import { hasRole, isAdmin, isVendor, isCustomer } from '@/lib/auth';
import { UserRole } from '@prisma/client';

describe('RBAC Helper Functions', () => {
  describe('hasRole', () => {
    it('should return true for exact role match', () => {
      expect(hasRole('admin' as UserRole, 'admin' as UserRole)).toBe(true);
      expect(hasRole('vendor' as UserRole, 'vendor' as UserRole)).toBe(true);
      expect(hasRole('customer' as UserRole, 'customer' as UserRole)).toBe(true);
    });

    it('should return false for role mismatch', () => {
      expect(hasRole('customer' as UserRole, 'admin' as UserRole)).toBe(false);
      expect(hasRole('vendor' as UserRole, 'admin' as UserRole)).toBe(false);
    });

    it('should return true if role is in array', () => {
      expect(hasRole('admin' as UserRole, ['admin', 'vendor'] as UserRole[])).toBe(true);
      expect(hasRole('vendor' as UserRole, ['admin', 'vendor'] as UserRole[])).toBe(true);
    });

    it('should return false if role is not in array', () => {
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
    it('should return true for vendor and admin roles', () => {
      expect(isVendor('vendor' as UserRole)).toBe(true);
      expect(isVendor('admin' as UserRole)).toBe(true);
    });

    it('should return false for customer role', () => {
      expect(isVendor('customer' as UserRole)).toBe(false);
    });
  });

  describe('isCustomer', () => {
    it('should return true for all roles', () => {
      expect(isCustomer('customer' as UserRole)).toBe(true);
      expect(isCustomer('vendor' as UserRole)).toBe(true);
      expect(isCustomer('admin' as UserRole)).toBe(true);
    });
  });
});
