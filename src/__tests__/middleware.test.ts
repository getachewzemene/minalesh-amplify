import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

// Mock auth module before importing middleware
vi.mock('@/lib/auth', () => {
  const mockGetTokenFromRequest = vi.fn();
  const mockGetUserFromToken = vi.fn();
  
  return {
    getTokenFromRequest: mockGetTokenFromRequest,
    getUserFromToken: mockGetUserFromToken,
    hasRole: (userRole: UserRole, requiredRole: UserRole | UserRole[]) => {
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
      }
      return userRole === requiredRole;
    },
  };
});

import { withAuth, withRole, withAdmin, withVendorOrAdmin } from '@/lib/middleware';
import * as authModule from '@/lib/auth';

const mockGetTokenFromRequest = authModule.getTokenFromRequest as ReturnType<typeof vi.fn>;
const mockGetUserFromToken = authModule.getUserFromToken as ReturnType<typeof vi.fn>;

describe('Middleware Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should return error when no token provided', () => {
      mockGetTokenFromRequest.mockReturnValue(null);
      mockGetUserFromToken.mockReturnValue(null);

      const req = new Request('http://localhost/api/test');
      const result = withAuth(req);

      expect(result.error).toBeDefined();
      expect(result.payload).toBeNull();
    });

    it('should return payload when token is valid', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'customer' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withAuth(req);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });
  });

  describe('withRole', () => {
    it('should return error when user does not have required role', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'customer' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withRole(req, 'admin' as UserRole);

      expect(result.error).toBeDefined();
      expect(result.payload).toBeNull();
    });

    it('should return payload when user has required role', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'admin@test.com',
        role: 'admin' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withRole(req, 'admin' as UserRole);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });

    it('should work with array of roles', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'vendor@test.com',
        role: 'vendor' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withRole(req, ['admin', 'vendor'] as UserRole[]);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });
  });

  describe('withAdmin', () => {
    it('should allow admin users', () => {
      const mockPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'admin' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withAdmin(req);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });

    it('should reject non-admin users', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'customer' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withAdmin(req);

      expect(result.error).toBeDefined();
      expect(result.payload).toBeNull();
    });
  });

  describe('withVendorOrAdmin', () => {
    it('should allow vendor users', () => {
      const mockPayload = {
        userId: 'vendor-1',
        email: 'vendor@test.com',
        role: 'vendor' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withVendorOrAdmin(req);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });

    it('should allow admin users', () => {
      const mockPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'admin' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withVendorOrAdmin(req);

      expect(result.error).toBeNull();
      expect(result.payload).toEqual(mockPayload);
    });

    it('should reject customer users', () => {
      const mockPayload = {
        userId: 'user-1',
        email: 'user@test.com',
        role: 'customer' as UserRole,
      };

      mockGetTokenFromRequest.mockReturnValue('valid-token');
      mockGetUserFromToken.mockReturnValue(mockPayload);

      const req = new Request('http://localhost/api/test');
      const result = withVendorOrAdmin(req);

      expect(result.error).toBeDefined();
      expect(result.payload).toBeNull();
    });
  });
});
