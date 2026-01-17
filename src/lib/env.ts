/**
 * Environment Variables Validation
 * 
 * Validates all environment variables at startup to ensure proper configuration.
 * Uses Zod for runtime validation with clear error messages.
 */

import { z } from 'zod';

/**
 * Environment validation schema
 * 
 * Required variables will throw an error if missing in production.
 * Optional variables have defaults or are feature-gated.
 */
const envSchema = z.object({
  // ========================================
  // Node Environment
  // ========================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ========================================
  // Database
  // ========================================
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // ========================================
  // Authentication & Security
  // ========================================
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),

  // ========================================
  // Application URLs
  // ========================================
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL').optional(),

  // ========================================
  // Email Service
  // ========================================
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email address').optional(),
  CONTACT_EMAIL: z.string().email('CONTACT_EMAIL must be a valid email address').optional(),
  CONTACT_PHONE: z.string().optional(),

  // ========================================
  // SMS Service
  // ========================================
  SMS_PROVIDER: z.enum(['africas_talking', 'twilio', 'none']).default('none'),
  AFRICAS_TALKING_USERNAME: z.string().optional(),
  AFRICAS_TALKING_API_KEY: z.string().optional(),
  AFRICAS_TALKING_SHORT_CODE: z.string().optional(),

  // ========================================
  // Payment Gateways
  // ========================================
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  // Ethiopian Payment Providers
  TELEBIRR_API_KEY: z.string().optional(),
  TELEBIRR_WEBHOOK_SECRET: z.string().optional(),
  CBE_API_KEY: z.string().optional(),
  CBE_WEBHOOK_SECRET: z.string().optional(),
  AWASH_API_KEY: z.string().optional(),
  AWASH_WEBHOOK_SECRET: z.string().optional(),

  // ========================================
  // Storage (AWS S3)
  // ========================================
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // ========================================
  // Caching (Redis)
  // ========================================
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  REDIS_TLS_ENABLED: z.enum(['true', 'false']).default('false'),

  // ========================================
  // Monitoring & Observability
  // ========================================
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // ========================================
  // Analytics
  // ========================================
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // ========================================
  // Government API Integration
  // ========================================
  GOV_API_KEY: z.string().optional(),

  // ========================================
  // Internal Services
  // ========================================
  INTERNAL_API_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address').optional(),
  ADMIN_EMAILS: z.string().optional(), // Comma-separated list

  // ========================================
  // Feature Flags & Configuration
  // ========================================
  REVERIFICATION_BATCH_SIZE: z.string().default('50'),
});

/**
 * Additional validation for production environment
 */
const productionRequirements = z.object({
  JWT_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(16),
  DATABASE_URL: z.string().url(),
  // In production, at least one payment method should be configured
  // This is a soft requirement - we check but don't enforce
});

/**
 * Validate environment variables
 * 
 * @throws {ZodError} If validation fails with detailed error messages
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Environment validation failed:');
    console.error(parsed.error.format());
    throw new Error(
      `Environment validation failed:\n${JSON.stringify(parsed.error.format(), null, 2)}`
    );
  }

  // Additional production checks (warnings only)
  if (parsed.data.NODE_ENV === 'production') {
    const productionCheck = productionRequirements.safeParse(process.env);
    
    if (!productionCheck.success) {
      console.warn('⚠️  Production environment warnings:');
      console.warn(productionCheck.error.format());
    }

    // Warn if no email service is configured
    if (!parsed.data.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set - email notifications will not work');
    }

    // Warn if no payment gateway is configured
    const hasPaymentGateway = 
      parsed.data.STRIPE_SECRET_KEY ||
      parsed.data.TELEBIRR_API_KEY ||
      parsed.data.CBE_API_KEY ||
      parsed.data.AWASH_API_KEY;

    if (!hasPaymentGateway) {
      console.warn('⚠️  No payment gateway configured - payments will not work');
    }

    // Warn if no storage is configured
    if (!parsed.data.AWS_S3_BUCKET || !parsed.data.AWS_ACCESS_KEY_ID || !parsed.data.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️  AWS S3 not fully configured - file uploads will not work');
    }

    // Warn if no monitoring is configured
    if (!parsed.data.SENTRY_DSN) {
      console.warn('⚠️  SENTRY_DSN not set - error tracking will not work');
    }
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * 
 * This object is safe to use throughout the application.
 * Access as: env.DATABASE_URL, env.JWT_SECRET, etc.
 */
export const env = validateEnv();

/**
 * Check if a specific feature is configured
 */
export const features = {
  hasEmail: () => !!env.RESEND_API_KEY,
  hasSMS: () => env.SMS_PROVIDER !== 'none' && !!env.AFRICAS_TALKING_API_KEY,
  hasStripe: () => !!env.STRIPE_SECRET_KEY,
  hasTeleBirr: () => !!env.TELEBIRR_API_KEY,
  hasCBE: () => !!env.CBE_API_KEY,
  hasAwash: () => !!env.AWASH_API_KEY,
  hasS3: () => !!env.AWS_S3_BUCKET && !!env.AWS_ACCESS_KEY_ID && !!env.AWS_SECRET_ACCESS_KEY,
  hasRedis: () => !!env.REDIS_URL,
  hasSentry: () => !!env.SENTRY_DSN,
  hasAnalytics: () => !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  hasGovAPI: () => !!env.GOV_API_KEY,
};

/**
 * Get configuration summary for health checks
 */
export function getConfigSummary() {
  return {
    environment: env.NODE_ENV,
    features: {
      email: features.hasEmail(),
      sms: features.hasSMS(),
      stripe: features.hasStripe(),
      teleBirr: features.hasTeleBirr(),
      cbe: features.hasCBE(),
      awash: features.hasAwash(),
      storage: features.hasS3(),
      cache: features.hasRedis(),
      monitoring: features.hasSentry(),
      analytics: features.hasAnalytics(),
      govAPI: features.hasGovAPI(),
    },
  };
}
