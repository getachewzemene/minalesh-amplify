import { describe, it, expect } from 'vitest';
import { 
  calculateLockoutTime, 
  isAccountLockedOut, 
  shouldResetLoginAttempts 
} from '@/lib/auth';

describe('Brute-Force Protection', () => {
  describe('calculateLockoutTime', () => {
    it('should calculate lockout time 15 minutes in the future', () => {
      const before = new Date();
      const lockoutTime = calculateLockoutTime();
      const after = new Date();
      
      // Should be approximately 15 minutes from now (allowing for test execution time)
      const expectedMinutes = 15;
      const diffMinutes = (lockoutTime.getTime() - before.getTime()) / 60000;
      
      expect(diffMinutes).toBeGreaterThanOrEqual(expectedMinutes - 0.1);
      expect(diffMinutes).toBeLessThanOrEqual(expectedMinutes + 0.1);
    });
  });

  describe('isAccountLockedOut', () => {
    it('should return false when lockoutUntil is null', () => {
      expect(isAccountLockedOut(null)).toBe(false);
    });

    it('should return true when lockoutUntil is in the future', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 10);
      expect(isAccountLockedOut(futureTime)).toBe(true);
    });

    it('should return false when lockoutUntil is in the past', () => {
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);
      expect(isAccountLockedOut(pastTime)).toBe(false);
    });
  });

  describe('shouldResetLoginAttempts', () => {
    it('should return false when login attempts is less than max', () => {
      expect(shouldResetLoginAttempts(3, null)).toBe(false);
    });

    it('should return true when attempts >= max and lockout has expired', () => {
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);
      expect(shouldResetLoginAttempts(5, pastTime)).toBe(true);
    });

    it('should return false when attempts >= max and lockout is active', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 10);
      expect(shouldResetLoginAttempts(5, futureTime)).toBe(false);
    });

    it('should return true when attempts >= max and no lockout time', () => {
      expect(shouldResetLoginAttempts(5, null)).toBe(true);
    });
  });
});
