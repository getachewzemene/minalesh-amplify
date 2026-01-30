# Production Environment Setup Guide

This guide walks you through configuring the Minalesh Marketplace for production deployment with all required environment variables and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Required Environment Variables](#required-environment-variables)
3. [Database Configuration](#database-configuration)
4. [Security Configuration](#security-configuration)
5. [Email Configuration](#email-configuration)
6. [Storage Configuration](#storage-configuration)
7. [Optional Services](#optional-services)
8. [Deployment Platforms](#deployment-platforms)
9. [Health Checks](#health-checks)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Generate Secure Secrets

Run the secrets generation script to create cryptographically secure values:

```bash
npm run generate:secrets
```

This will generate:
- `JWT_SECRET` (64 chars) - For JWT token signing
- `CRON_SECRET` (32 chars) - For securing cron endpoints
- `INTERNAL_API_SECRET` (32 chars) - For internal API calls
- `PAYMENT_WEBHOOK_SECRET` (32 chars) - For payment webhooks

**⚠️ Important:** Save these values securely. Never commit them to version control.

### 2. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 3. Configure Required Variables

At minimum, set these variables in your `.env` file:

```bash
# Database (with connection pooling)
DATABASE_URL=postgresql://user:password@host:6543/db?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://user:password@host:5432/db

# Security
JWT_SECRET=<generated-value-from-script>
CRON_SECRET=<generated-value-from-script>

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Required Environment Variables

### Critical (Application won't start without these)

| Variable | Description | Example | Min Length |
|----------|-------------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection URL (pooled) | `postgresql://user:pass@host:6543/db?pgbouncer=true` | - |
| `JWT_SECRET` | Secret for JWT signing | Generated via script | 32 chars |
| `CRON_SECRET` | Secret for cron endpoints | Generated via script | 16 chars |

### Recommended for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `DIRECT_URL` | Direct database connection (migrations) | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `https://minalesh.et` |
| `RESEND_API_KEY` | Email service API key | `re_xxxxxxxxxxxx` |
| `AWS_S3_BUCKET` | S3 bucket for media | `minalesh-media-prod` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAXXXXXXXXXXXXXXXX` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

---

## Database Configuration

### Connection Pooling

The application uses **connection pooling** for optimal performance in serverless environments.

#### Supabase Setup

```bash
# Pooled connection (PgBouncer on port 6543)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (port 5432 for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Key Points:**
- `DATABASE_URL` uses port **6543** with `pgbouncer=true`
- `DIRECT_URL` uses port **5432** for migrations
- `connection_limit=1` optimizes for serverless

#### Neon Setup

```bash
# Neon has automatic pooling
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

**Key Points:**
- Same URL for both (pooling is automatic)
- Always use `sslmode=require` in production

#### AWS RDS / DigitalOcean

```bash
# With RDS Proxy (recommended)
DATABASE_URL="postgresql://user:password@your-rds-proxy.region.rds.amazonaws.com:5432/dbname?sslmode=require&connection_limit=1"

# Direct connection
DIRECT_URL="postgresql://user:password@your-rds-instance.region.rds.amazonaws.com:5432/dbname?sslmode=require"
```

**Key Points:**
- Use RDS Proxy for connection pooling
- Enable SSL with `sslmode=require`

#### Verify Connection Pooling

After setup, verify your database configuration:

```bash
# Check Prisma configuration
npx prisma validate

# Test database connection
npx prisma db pull
```

---

## Security Configuration

### JWT Secret

The JWT secret is used to sign and verify authentication tokens.

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Different for each environment

**Generate:**
```bash
# Using our script (recommended)
npm run generate:secrets

# Or manually
openssl rand -base64 48
```

**Set:**
```bash
JWT_SECRET=<your-generated-secret>
```

### Cron Secret

Protects cron endpoints from unauthorized access.

**Requirements:**
- Minimum 16 characters
- Cryptographically random

**Generate:**
```bash
# Using our script (recommended)
npm run generate:secrets

# Or manually
openssl rand -base64 24
```

**Set:**
```bash
CRON_SECRET=<your-generated-secret>
```

**Usage:**

Cron jobs must include the secret in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/vendor-reverification
```

### Security Best Practices

1. **Rotate secrets every 90 days minimum**
2. **Use different secrets for dev/staging/prod**
3. **Never share secrets over email or chat**
4. **Store in secure vault** (AWS Secrets Manager, etc.)
5. **Revoke immediately if exposed**

---

## Email Configuration

### Resend Setup

1. **Sign up:** [resend.com](https://resend.com)
2. **Get API key:** Dashboard → API Keys → Create
3. **Verify domain:** Settings → Domains → Add Domain

**Configuration:**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com
```

**Testing:**
```bash
# Development: emails are logged to console
NODE_ENV=development

# Production: emails are sent via Resend
NODE_ENV=production
```

### Email Templates

The application sends these emails:
- Order confirmations
- Shipping notifications
- Vendor verification updates
- Password reset
- Account notifications

All templates are in `/src/lib/email.ts`.

---

## Storage Configuration

### AWS S3 Setup

1. **Create S3 bucket:**
```bash
aws s3 mb s3://minalesh-media-prod --region us-east-1
```

2. **Set CORS policy:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. **Create IAM user with S3 permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::minalesh-media-prod",
        "arn:aws:s3:::minalesh-media-prod/*"
      ]
    }
  ]
}
```

4. **Configure environment:**
```bash
AWS_S3_BUCKET=minalesh-media-prod
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### CloudFront CDN (Optional)

For better performance, add CloudFront:

1. **Create distribution** pointing to S3 bucket
2. **Configure caching** behavior
3. **Set environment:**
```bash
NEXT_PUBLIC_CDN_URL=https://d1234567890abc.cloudfront.net
NEXT_PUBLIC_CDN_PROVIDER=cloudfront
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

---

## Optional Services

### Payment Gateways

#### Stripe (International)
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### TeleBirr (Ethiopia)
```bash
TELEBIRR_API_KEY=your-telebirr-api-key
TELEBIRR_WEBHOOK_SECRET=your-telebirr-webhook-secret
```

### Monitoring

#### Sentry (Error Tracking)
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=minalesh-marketplace
```

#### Datadog (APM)
```bash
DATADOG_API_KEY=your-datadog-api-key
DD_SERVICE=minalesh-marketplace
DD_ENV=production
```

### Caching

#### Redis
```bash
# Upstash Redis
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
REDIS_TLS_ENABLED=true

# Local Redis
REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false
```

---

## Deployment Platforms

### Vercel

**One-click deploy:**
```bash
vercel --prod
```

**Set environment variables:**
```bash
# Add required variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add CRON_SECRET production

# Add from .env file
vercel env pull .env.production.local
```

**Cron jobs:**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/vendor-reverification",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Railway

**Deploy:**
```bash
railway up
```

**Set variables:**
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="..."
railway variables set CRON_SECRET="..."
```

### AWS (ECS/EC2)

**Store secrets in Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name minalesh/production \
  --secret-string file://secrets.json
```

**Reference in ECS task definition:**
```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:minalesh/production:JWT_SECRET::"
    }
  ]
}
```

---

## Health Checks

### Verify Configuration

**API endpoint:**
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "environment": "production",
  "features": {
    "email": true,
    "storage": true,
    "cache": true,
    "monitoring": true,
    "stripe": true
  }
}
```

### Verify Database

```bash
# Check connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy

# Verify data
npx prisma studio
```

### Verify S3

```bash
# Upload test file
aws s3 cp test.txt s3://your-bucket/test/test.txt

# Download test file
aws s3 cp s3://your-bucket/test/test.txt downloaded.txt
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `P1001: Can't reach database server`

**Solutions:**
1. Check DATABASE_URL format
2. Verify network/firewall rules
3. Confirm database is running
4. Check SSL mode (`sslmode=require`)

### JWT Validation Errors

**Error:** `JWT_SECRET must be at least 32 characters`

**Solutions:**
1. Generate new secret: `npm run generate:secrets`
2. Verify secret length
3. Check for whitespace or special characters
4. Ensure secret matches across environments

### S3 Upload Failures

**Error:** `Access Denied`

**Solutions:**
1. Verify IAM permissions
2. Check bucket policy
3. Confirm CORS configuration
4. Verify AWS credentials

### Email Not Sending

**Error:** `Resend API key not configured`

**Solutions:**
1. Set `RESEND_API_KEY` in environment
2. Verify API key is valid
3. Check domain verification
4. Review Resend dashboard logs

---

## Production Checklist

Before going live, verify:

- [ ] `DATABASE_URL` configured with pooling
- [ ] `DIRECT_URL` configured for migrations
- [ ] `JWT_SECRET` set to secure random value (32+ chars)
- [ ] `CRON_SECRET` set to secure random value (16+ chars)
- [ ] `NODE_ENV=production`
- [ ] `RESEND_API_KEY` configured and domain verified
- [ ] `AWS_S3_BUCKET` configured with proper permissions
- [ ] SSL enabled on database connection
- [ ] CORS configured on S3 bucket
- [ ] Error monitoring (Sentry) configured
- [ ] Cron jobs scheduled
- [ ] Health check endpoint working
- [ ] Database migrations run
- [ ] Payment gateway configured and tested
- [ ] All secrets stored in secure vault
- [ ] `.env` file added to `.gitignore`
- [ ] No secrets committed to version control

---

## Support

For issues or questions:
- **Documentation:** Check `/docs` folder
- **Email:** support@minalesh.et
- **GitHub:** Open an issue in the repository

---

**Last Updated:** January 2026  
**Version:** 1.0.0
