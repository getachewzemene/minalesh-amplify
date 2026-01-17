/**
 * Tests for Environment Variables Validation
 * 
 * Tests the env.ts module to ensure environment variables are properly validated.
 * 
 * Testing Approach:
 * - Each test runs in isolation with a fresh copy of process.env
 * - We use vi.resetModules() to ensure fresh imports of the env module
 * - Tests verify both successful validation and proper error handling
 * - Feature detection and configuration summary functions are tested
 * 
 * Test Categories:
 * 1. Required Variables - Tests validation of mandatory configuration
 * 2. Optional Variables - Tests default values and custom configurations
 * 3. Email Configuration - Tests email address validation
 * 4. Feature Detection - Tests runtime feature availability checks
 * 5. Configuration Summary - Tests the configuration reporting function
 * 6. URL Validation - Tests URL format validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Validation', () => {
  // Save original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules();
    // Create a copy of process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should validate with all required variables present', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      const { env } = await import('@/lib/env');

      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/test');
      expect(env.JWT_SECRET).toBe('this-is-a-very-long-secret-key-with-32-plus-characters');
      expect(env.CRON_SECRET).toBe('cron-secret-16-chars-min');
      expect(env.NODE_ENV).toBe('development');
    });

    it('should fail when DATABASE_URL is missing', async () => {
      process.env.NODE_ENV = 'development';
      // DATABASE_URL is missing
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });

    it('should fail when DATABASE_URL is not a valid URL', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'not-a-valid-url';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });

    it('should fail when JWT_SECRET is too short', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'short'; // Less than 32 characters
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });

    it('should fail when CRON_SECRET is too short', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'short'; // Less than 16 characters

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });
  });

  describe('Optional Variables', () => {
    it('should use defaults for optional variables', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      const { env } = await import('@/lib/env');

      expect(env.JWT_EXPIRES_IN).toBe('7d');
      expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe('30d');
      expect(env.LOG_LEVEL).toBe('info');
      expect(env.SMS_PROVIDER).toBe('none');
      // AWS_REGION is now optional with no default
      expect(env.AWS_REGION).toBeUndefined();
    });

    it('should accept custom values for optional variables', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.JWT_EXPIRES_IN = '1d';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
      process.env.LOG_LEVEL = 'debug';
      process.env.AWS_REGION = 'eu-west-1';

      const { env } = await import('@/lib/env');

      expect(env.JWT_EXPIRES_IN).toBe('1d');
      expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe('7d');
      expect(env.LOG_LEVEL).toBe('debug');
      expect(env.AWS_REGION).toBe('eu-west-1');
    });
  });

  describe('Email Configuration', () => {
    it('should validate email addresses', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.EMAIL_FROM = 'noreply@example.com';
      process.env.CONTACT_EMAIL = 'contact@example.com';
      process.env.ADMIN_EMAIL = 'admin@example.com';

      const { env } = await import('@/lib/env');

      expect(env.EMAIL_FROM).toBe('noreply@example.com');
      expect(env.CONTACT_EMAIL).toBe('contact@example.com');
      expect(env.ADMIN_EMAIL).toBe('admin@example.com');
    });

    it('should fail with invalid email addresses', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.EMAIL_FROM = 'not-an-email';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });
  });

  describe('Feature Detection', () => {
    it('should detect when features are configured', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.STRIPE_SECRET_KEY = 'sk_test_key';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.SENTRY_DSN = 'https://key@sentry.io/project';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'AKIATEST';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret';

      const { features } = await import('@/lib/env');

      expect(features.hasEmail()).toBe(true);
      expect(features.hasStripe()).toBe(true);
      expect(features.hasRedis()).toBe(true);
      expect(features.hasSentry()).toBe(true);
      expect(features.hasS3()).toBe(true);
    });

    it('should detect when features are not configured', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';

      const { features } = await import('@/lib/env');

      expect(features.hasEmail()).toBe(false);
      expect(features.hasStripe()).toBe(false);
      expect(features.hasRedis()).toBe(false);
      expect(features.hasSentry()).toBe(false);
      expect(features.hasS3()).toBe(false);
      expect(features.hasSMS()).toBe(false);
    });

    it('should detect SMS provider configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.SMS_PROVIDER = 'africas_talking';
      process.env.AFRICAS_TALKING_API_KEY = 'test_key';
      process.env.AFRICAS_TALKING_USERNAME = 'test_username';

      const { features } = await import('@/lib/env');

      expect(features.hasSMS()).toBe(true);
    });
  });

  describe('Configuration Summary', () => {
    it('should return configuration summary', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.STRIPE_SECRET_KEY = 'sk_live_key';
      process.env.RESEND_API_KEY = 're_live_key';

      const { getConfigSummary } = await import('@/lib/env');
      const summary = getConfigSummary();

      expect(summary.environment).toBe('production');
      expect(summary.features).toBeDefined();
      expect(summary.features.stripe).toBe(true);
      expect(summary.features.email).toBe(true);
      expect(summary.features.storage).toBe(false); // S3 not configured
    });
  });

  describe('URL Validation', () => {
    it('should validate public URLs', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      const { env } = await import('@/lib/env');

      expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
      expect(env.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
    });

    it('should fail with invalid URLs', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-with-32-plus-characters';
      process.env.CRON_SECRET = 'cron-secret-16-chars-min';
      process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';

      await expect(async () => {
        await import('@/lib/env');
      }).rejects.toThrow();
    });
  });
});
