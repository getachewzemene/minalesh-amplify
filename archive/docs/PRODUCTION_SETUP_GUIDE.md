# Production Setup Guide - Minalesh Marketplace

**Version:** 1.0  
**Last Updated:** January 23, 2026  
**Status:** Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Payment Gateway Setup](#payment-gateway-setup)
5. [SMS Notifications Setup](#sms-notifications-setup)
6. [Secrets Management](#secrets-management)
7. [Deployment Checklist](#deployment-checklist)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through setting up the Minalesh Marketplace for production deployment. It covers all critical configurations including payment gateways, SMS notifications, and environment validation.

### What You'll Configure

- ✅ Environment variables and secrets
- ✅ Payment gateways (Stripe, TeleBirr, CBE, Awash)
- ✅ SMS notifications (Africa's Talking)
- ✅ Database with SSL/pooling
- ✅ Email service (Resend)
- ✅ File storage (AWS S3)
- ✅ Monitoring (Sentry)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Production PostgreSQL database (Supabase/Neon recommended)
- [ ] Domain name configured
- [ ] SSL certificate (auto-configured on Vercel/AWS Amplify)
- [ ] Access to payment gateway credentials
- [ ] SMS service account (if using SMS notifications)

---

## Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.example .env.production
```

### Step 2: Configure Required Variables

These variables are **required** for the application to start:

```bash
# Node Environment
NODE_ENV=production

# Database (with SSL enabled)
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Authentication & Security
JWT_SECRET=$(openssl rand -base64 32)  # Generate strong secret
CRON_SECRET=$(openssl rand -base64 16) # Generate strong secret
```

**Important Security Notes:**
- Never use default/example secrets in production
- Use different secrets for dev/staging/production
- Store secrets in your hosting platform's secret manager
- Rotate secrets every 90 days minimum

### Step 3: Configure Application URLs

```bash
# Replace with your actual domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## Payment Gateway Setup

### Stripe (International Payments)

**Step 1: Get Production Keys**

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to Production mode (toggle in top-right)
3. Go to Developers → API Keys
4. Copy your keys:

```bash
STRIPE_SECRET_KEY=sk_live_XXXX...  # Your production secret key
STRIPE_WEBHOOK_SECRET=whsec_XXXX...  # Your webhook signing secret
```

**Step 2: Configure Webhook**

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

**Step 3: Test Webhook**

```bash
# Send test event from Stripe Dashboard
# Verify in your logs that webhook was received
```

### TeleBirr (Ethiopian Mobile Money)

**Step 1: Get Production Credentials**

1. Contact TeleBirr Business (https://www.ethiotelecom.et/telebirr-business/)
2. Complete merchant registration
3. Obtain production API credentials

```bash
TELEBIRR_API_KEY=your_production_api_key
TELEBIRR_WEBHOOK_SECRET=your_webhook_secret
```

**Step 2: Configure Webhook Endpoint**

Provide TeleBirr with your webhook URL:
```
https://yourdomain.com/api/payments/webhook
```

**Step 3: Test Integration**

```bash
# Use TeleBirr test app to make a test payment
# Verify order status updates correctly
```

### CBE Birr (Commercial Bank of Ethiopia)

**Step 1: Get Production Credentials**

1. Contact CBE Digital Banking (https://www.combanketh.et)
2. Register as merchant
3. Obtain API credentials

```bash
CBE_API_KEY=your_production_api_key
CBE_WEBHOOK_SECRET=your_webhook_secret
```

**Step 2: Configure Webhook**

Provide CBE with your webhook URL:
```
https://yourdomain.com/api/payments/webhook
```

### Awash Bank

**Step 1: Get Production Credentials**

```bash
AWASH_API_KEY=your_production_api_key
AWASH_WEBHOOK_SECRET=your_webhook_secret
```

**Step 2: Configure Webhook**

Provide Awash Bank with your webhook URL:
```
https://yourdomain.com/api/payments/webhook
```

### Generic Webhook Security

All payment webhooks should be secured:

```bash
# Generic webhook secret for additional security
PAYMENT_WEBHOOK_SECRET=$(openssl rand -base64 32)
```

---

## SMS Notifications Setup

SMS notifications keep customers informed about their order status through every stage of delivery.

### Supported Providers

- **Africa's Talking** (Recommended for Ethiopia) ⭐
- **Twilio** (International)
- **Mock** (Development/Testing only)

### Africa's Talking Setup (Recommended)

**Step 1: Create Account**

1. Go to [Africa's Talking](https://africastalking.com)
2. Sign up for a business account
3. Verify your business documents
4. Add credit to your account

**Step 2: Get Production Credentials**

1. Log in to Africa's Talking Dashboard
2. Go to Account → API Settings
3. Copy your credentials:

```bash
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_production_api_key
AFRICAS_TALKING_SHORT_CODE=12345  # Optional: Your sender ID/short code
```

**Step 3: Configure Sender ID (Optional)**

1. In Africa's Talking Dashboard, request a custom sender ID
2. Submit for approval (usually takes 1-3 business days)
3. Once approved, update `AFRICAS_TALKING_SHORT_CODE`

**Step 4: Test SMS Service**

```bash
# Make a test order in your application
# Verify SMS is sent at each order stage:
# - Order placed
# - Order confirmed
# - Order packed
# - Picked up by courier
# - In transit
# - Out for delivery
# - Delivered
```

### SMS Notification Workflow

The system automatically sends SMS at these stages:

1. **Order Placed** → "Your order #MIN-XXX has been placed successfully"
2. **Vendor Confirmed** → "Your order has been confirmed by the vendor"
3. **Packed** → "Your order has been packed and ready for pickup"
4. **Picked Up** → "Your order has been picked up by [Courier Name]"
5. **In Transit** → "Your order is on the way!"
6. **Out for Delivery** → "Your order is out for delivery"
7. **Delivered** → "Your order has been delivered! Thank you for shopping"

### Phone Number Format

The system automatically formats Ethiopian phone numbers:

- Input: `0911234567` → Output: `+251911234567`
- Input: `911234567` → Output: `+251911234567`
- Input: `+251911234567` → Output: `+251911234567`

### Twilio Setup (Alternative)

```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Disable SMS (Optional)

If you don't want to use SMS notifications:

```bash
SMS_PROVIDER=none
```

---

## Secrets Management

### Environment Variable Organization

Organize your environment variables by category:

```bash
# ==========================================
# DATABASE
# ==========================================
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# ==========================================
# AUTHENTICATION & SECURITY
# ==========================================
JWT_SECRET=...
CRON_SECRET=...

# ==========================================
# PAYMENT GATEWAYS
# ==========================================
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
TELEBIRR_API_KEY=...
...

# ==========================================
# SMS NOTIFICATIONS
# ==========================================
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_API_KEY=...
...

# ==========================================
# EMAIL SERVICE
# ==========================================
RESEND_API_KEY=...
EMAIL_FROM=...

# ==========================================
# FILE STORAGE
# ==========================================
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# ==========================================
# MONITORING
# ==========================================
SENTRY_DSN=...
LOG_LEVEL=info
```

### Secret Generation

Use strong, random secrets:

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Cron Secret (16+ characters)
openssl rand -base64 16

# Generic secret
openssl rand -base64 24
```

### Secrets Storage

**For Vercel:**
```bash
# Add via Vercel Dashboard
vercel env add JWT_SECRET
# Or via CLI
echo "your-secret" | vercel env add JWT_SECRET production
```

**For AWS Amplify:**
```bash
# Add via AWS Console → Amplify → Environment Variables
# Or via AWS CLI
aws amplify put-environment-variable \
  --app-id YOUR_APP_ID \
  --environment-name production \
  --environment-variables JWT_SECRET=your-secret
```

**For other platforms:**
- Use platform's secret management system
- Never commit secrets to Git
- Use different secrets per environment

### Secret Rotation

Rotate secrets regularly:

1. **JWT_SECRET** - Every 90 days
   - Generate new secret
   - Update environment variable
   - Existing sessions will expire naturally
   
2. **Payment Webhook Secrets** - Every 180 days
   - Generate new secret
   - Update in payment provider dashboard
   - Update environment variable
   
3. **API Keys** - When compromised or annually
   - Revoke old key
   - Generate new key
   - Update environment variable

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Secrets generated with sufficient entropy
- [ ] Database configured with SSL
- [ ] At least one payment gateway configured
- [ ] Email service configured (Resend)
- [ ] SMS service configured (if using)
- [ ] S3 bucket configured (if using)
- [ ] Sentry DSN configured (recommended)

### Database Setup

```bash
# 1. Run migrations
npx prisma migrate deploy

# 2. Seed Ethiopian categories
npx tsx prisma/seeds/categories.ts

# 3. Seed shipping zones and tax rates
npx tsx prisma/seeds/shipping-tax.ts

# 4. Create admin user
npm run init:admin
```

### Application Deployment

- [ ] Deploy to hosting platform (Vercel/AWS Amplify)
- [ ] Configure custom domain
- [ ] Enable automatic SSL
- [ ] Set environment variables
- [ ] Configure cron jobs (if supported)

### Post-Deployment Verification

- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Health check endpoint responding: `/api/health`
- [ ] User registration works
- [ ] Email notifications sent
- [ ] SMS notifications sent (if configured)
- [ ] Payment webhook received successfully
- [ ] Admin dashboard accessible

### Cron Jobs Setup

Configure these cron jobs in your hosting platform:

```bash
# Email queue processor (every 1-5 minutes)
*/5 * * * * curl https://yourdomain.com/api/cron/process-email-queue \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Webhook retry (every 5-10 minutes)
*/10 * * * * curl https://yourdomain.com/api/cron/retry-webhooks \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Inventory cleanup (every 5 minutes)
*/5 * * * * curl https://yourdomain.com/api/cron/cleanup-reservations \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Vendor reverification (daily at 2 AM)
0 2 * * * curl https://yourdomain.com/api/cron/reverify-vendors \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## Monitoring & Health Checks

### Health Check Endpoint

Monitor your application health:

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health check (includes config)
curl https://yourdomain.com/api/health?detailed=true
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": true,
    "uptime": 86400
  },
  "config": {
    "environment": "production",
    "features": {
      "email": true,
      "sms": true,
      "stripe": true,
      "teleBirr": true,
      "storage": true,
      "monitoring": true
    }
  }
}
```

### Database Health

Monitor database health:

```bash
curl https://yourdomain.com/api/health/db?detailed=true
```

### Uptime Monitoring

Set up uptime monitoring with:

- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**

Monitor these endpoints:
- `https://yourdomain.com/api/health` (every 5 minutes)
- `https://yourdomain.com` (every 5 minutes)

### Error Tracking

Configure Sentry for error tracking:

```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=minalesh-marketplace
```

### Alerting

Set up alerts for:

- ❌ Application downtime (> 1 minute)
- ❌ Error rate > 1%
- ❌ Response time > 3 seconds
- ❌ Database connection failures
- ❌ Payment webhook failures
- ⚠️ SMS delivery failures
- ⚠️ Email delivery failures

---

## Troubleshooting

### Application Won't Start

**Error: "Environment validation failed"**

```
❌ Environment validation failed:
{
  "DATABASE_URL": {
    "_errors": ["Required"]
  }
}
```

**Solution:** Ensure all required environment variables are set:
```bash
DATABASE_URL=...
JWT_SECRET=...
CRON_SECRET=...
```

**Error: "JWT_SECRET must be at least 32 characters"**

**Solution:** Generate a longer secret:
```bash
openssl rand -base64 32
```

### Payment Issues

**Error: "No payment gateway configured"**

**Solution:** Configure at least one payment gateway:
```bash
STRIPE_SECRET_KEY=sk_live_...
# OR
TELEBIRR_API_KEY=...
# OR
CBE_API_KEY=...
```

**Webhook not received**

**Solution:**
1. Check webhook URL is correct in payment provider dashboard
2. Verify webhook secret matches environment variable
3. Check application logs for webhook errors
4. Test webhook with provider's testing tool

### SMS Issues

**SMS not sending**

**Solution:**
1. Verify SMS provider is configured:
   ```bash
   SMS_PROVIDER=africas_talking
   AFRICAS_TALKING_API_KEY=...
   AFRICAS_TALKING_USERNAME=...
   ```
2. Check Africa's Talking account has sufficient credit
3. Verify phone number format is correct (+251...)
4. Check application logs for SMS errors

**SMS sent but not received**

**Solution:**
1. Verify phone number is correct
2. Check carrier network issues
3. Verify sender ID is approved (if using custom sender ID)
4. Check Africa's Talking logs in dashboard

### Database Issues

**Error: "Database connection failed"**

**Solution:**
1. Verify DATABASE_URL is correct
2. Ensure SSL is enabled: `?sslmode=require`
3. Check database server is running
4. Verify IP whitelist includes your application
5. Test connection with psql:
   ```bash
   psql "postgresql://user:pass@host:5432/db?sslmode=require"
   ```

**Slow queries**

**Solution:**
1. Check connection pooling is enabled
2. Monitor database performance in provider dashboard
3. Review slow query logs
4. Add indexes for frequently queried fields

### Email Issues

**Emails not sending**

**Solution:**
1. Verify Resend API key is configured:
   ```bash
   RESEND_API_KEY=re_...
   ```
2. Verify sender email is verified in Resend
3. Check email queue status in database
4. Review application logs for email errors

---

## Production Best Practices

### Security

1. ✅ Always use HTTPS in production
2. ✅ Enable SSL for database connections
3. ✅ Use strong, random secrets (32+ chars)
4. ✅ Rotate secrets every 90 days
5. ✅ Never commit secrets to Git
6. ✅ Use different secrets per environment
7. ✅ Enable rate limiting on sensitive endpoints
8. ✅ Configure CORS properly

### Performance

1. ✅ Enable database connection pooling
2. ✅ Use Redis for caching (optional but recommended)
3. ✅ Configure CDN for static assets
4. ✅ Enable image optimization
5. ✅ Monitor slow queries
6. ✅ Set appropriate cache headers

### Monitoring

1. ✅ Configure Sentry for error tracking
2. ✅ Set up uptime monitoring
3. ✅ Monitor database performance
4. ✅ Track payment success rates
5. ✅ Monitor SMS/email delivery rates
6. ✅ Set up alerting for critical issues

### Backup & Recovery

1. ✅ Enable automated database backups (daily minimum)
2. ✅ Test backup restoration regularly
3. ✅ Store backups in different region
4. ✅ Document recovery procedures
5. ✅ Maintain backup of environment variables

---

## Support

For additional help:

- **Documentation:** See other guides in `/docs` directory
- **GitHub Issues:** Report bugs or request features
- **Email:** support@minalesh.com

---

**Last Updated:** January 23, 2026  
**Version:** 1.0  
**Status:** Production Ready
