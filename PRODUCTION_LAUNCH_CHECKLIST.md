# Production Deployment Checklist

Use this checklist before deploying Minalesh Marketplace to production.

## Pre-Deployment

### 1. Environment Variables

#### Required Variables (Critical)
- [ ] `DATABASE_URL` - PostgreSQL connection with pooling configured
- [ ] `DIRECT_URL` - Direct database connection for migrations
- [ ] `JWT_SECRET` - Generated using `npm run generate:secrets` (min 32 chars)
- [ ] `CRON_SECRET` - Generated using `npm run generate:secrets` (min 16 chars)
- [ ] `NODE_ENV=production`

#### Recommended Variables
- [ ] `RESEND_API_KEY` - Email service configured and domain verified
- [ ] `EMAIL_FROM` - Verified sender email address
- [ ] `AWS_S3_BUCKET` - S3 bucket created and configured
- [ ] `AWS_ACCESS_KEY_ID` - IAM user with S3 permissions
- [ ] `AWS_SECRET_ACCESS_KEY` - IAM secret key
- [ ] `AWS_REGION` - AWS region (e.g., us-east-1)
- [ ] `NEXT_PUBLIC_APP_URL` - Production application URL
- [ ] `SENTRY_DSN` - Error monitoring configured

#### Payment Gateway (At least one required)
- [ ] `STRIPE_SECRET_KEY` - Stripe configured for international payments
- [ ] `TELEBIRR_API_KEY` - TeleBirr configured for Ethiopian payments
- [ ] `CBE_API_KEY` - CBE Birr configured
- [ ] `AWASH_API_KEY` - Awash Bank configured

### 2. Database Setup

- [ ] Production database created (PostgreSQL)
- [ ] SSL/TLS enabled (`sslmode=require` in connection string)
- [ ] Connection pooling configured:
  - [ ] Supabase: Port 6543 with `pgbouncer=true`
  - [ ] Neon: Automatic pooling enabled
  - [ ] RDS: RDS Proxy configured
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Database backup strategy configured
- [ ] Database monitoring enabled

### 3. Security

- [ ] All secrets generated using secure random values
- [ ] Different secrets for dev/staging/prod environments
- [ ] Secrets stored in secure vault (AWS Secrets Manager, etc.)
- [ ] No secrets committed to version control (check `.env` in `.gitignore`)
- [ ] HTTPS/TLS enabled on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting configured
- [ ] DDoS protection enabled

### 4. Storage (S3)

- [ ] S3 bucket created
- [ ] Bucket policy configured
- [ ] CORS policy set up
- [ ] IAM user created with minimal permissions
- [ ] CloudFront CDN configured (optional but recommended)
- [ ] Bucket versioning enabled
- [ ] Lifecycle policies configured

### 5. Email Service (Resend)

- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] Sender email configured
- [ ] Email templates tested
- [ ] SPF/DKIM records added to DNS
- [ ] DMARC policy configured

### 6. Monitoring & Logging

- [ ] Sentry error tracking configured
- [ ] Logging level set appropriately (`LOG_LEVEL=info`)
- [ ] Application performance monitoring (APM) set up
- [ ] Uptime monitoring configured
- [ ] Alert notifications configured (Slack, email, etc.)
- [ ] Dashboard for metrics created

### 7. Cron Jobs

- [ ] Cron jobs scheduled on platform (Vercel Cron, etc.)
- [ ] `CRON_SECRET` configured in cron triggers
- [ ] Test cron endpoints manually before scheduling:
  - [ ] `/api/cron/vendor-reverification`
  - [ ] `/api/cron/send-abandoned-cart-emails`
  - [ ] `/api/cron/process-premium-renewals`
  - [ ] `/api/cron/subscription-renewal-reminders`
  - [ ] `/api/cron/low-stock-alert`

### 8. Testing

- [ ] All environment variables validated: `npm run build`
- [ ] Database connection tested
- [ ] Email sending tested (order confirmation, etc.)
- [ ] File upload to S3 tested
- [ ] Payment gateway tested (test mode first)
- [ ] User registration/login tested
- [ ] Order placement tested
- [ ] Vendor verification tested
- [ ] Error reporting tested (trigger an error, check Sentry)

### 9. Performance

- [ ] Next.js build optimized: `npm run build`
- [ ] Images optimized (WebP format, proper sizes)
- [ ] Static assets cached properly
- [ ] Database queries optimized (indexes created)
- [ ] Connection pooling verified
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented (Redis optional)

### 10. Legal & Compliance

- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Cookie consent implemented
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Ethiopian data protection laws reviewed
- [ ] Business licenses verified

## Deployment Steps

### 1. Build Verification

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Run tests
npm test

# Build application
npm run build
```

### 2. Database Migration

```bash
# Verify migration files
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Verify schema
npx prisma validate

# Generate Prisma client
npx prisma generate
```

### 3. Deploy Application

#### Vercel
```bash
# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... add all other variables
```

#### Railway
```bash
# Deploy
railway up

# Set variables
railway variables set DATABASE_URL="..."
railway variables set JWT_SECRET="..."
```

#### Docker (Self-hosted)
```bash
# Build image
docker build -t minalesh-marketplace .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  --name minalesh-prod \
  minalesh-marketplace
```

### 4. Post-Deployment Verification

- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Application loads in browser
- [ ] User registration works
- [ ] Login works
- [ ] Database queries execute successfully
- [ ] Email notifications send
- [ ] File uploads work
- [ ] Payment processing works (test mode)
- [ ] Error tracking works (check Sentry)

### 5. Smoke Tests

Run these tests immediately after deployment:

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test database connection (check response time)
curl https://your-domain.com/api/products?limit=10

# Test authentication
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'
```

## Post-Deployment

### 1. Monitoring Setup

- [ ] Set up monitoring dashboard
- [ ] Configure alerts for:
  - [ ] Error rate > threshold
  - [ ] Response time > threshold
  - [ ] Database connection failures
  - [ ] High memory/CPU usage
  - [ ] Failed cron jobs
- [ ] Set up on-call rotation (if applicable)

### 2. Backup Strategy

- [ ] Database backups automated
- [ ] S3 bucket versioning enabled
- [ ] Backup restoration tested
- [ ] Backup retention policy defined

### 3. Performance Monitoring

- [ ] Baseline metrics collected
- [ ] Performance budgets defined
- [ ] Slow query monitoring enabled
- [ ] Cache hit rate monitored (if using Redis)

### 4. Security Monitoring

- [ ] Security headers configured
- [ ] SSL certificate auto-renewal enabled
- [ ] Vulnerability scanning scheduled
- [ ] Access logs monitored
- [ ] Failed login attempts tracked

### 5. Documentation

- [ ] Deployment process documented
- [ ] Runbook created for common issues
- [ ] Rollback procedure documented
- [ ] Escalation contacts updated
- [ ] Architecture diagram updated

## Rollback Plan

In case of issues, have a rollback plan ready:

### Vercel
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Railway
```bash
# Rollback to previous deployment
railway rollback
```

### Database
```bash
# If migration causes issues
npx prisma migrate resolve --rolled-back <migration-name>
```

## Emergency Contacts

- **Technical Lead:** [Name, Contact]
- **Database Admin:** [Name, Contact]
- **DevOps:** [Name, Contact]
- **On-call Engineer:** [Contact, Schedule]

## Post-Launch Checklist (First 24 Hours)

- [ ] Monitor error rates
- [ ] Check application performance
- [ ] Verify cron jobs ran successfully
- [ ] Review user registrations/orders
- [ ] Check email delivery rates
- [ ] Monitor database performance
- [ ] Review security logs
- [ ] Collect user feedback
- [ ] Document any issues encountered

## Weekly Maintenance

- [ ] Review error logs
- [ ] Check application performance trends
- [ ] Verify backup integrity
- [ ] Update dependencies (security patches)
- [ ] Review and optimize slow queries
- [ ] Clean up old logs
- [ ] Review monitoring alerts

## Monthly Maintenance

- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Update documentation
- [ ] Review and update dependencies
- [ ] Test disaster recovery plan
- [ ] Rotate secrets (every 90 days)

---

## Quick Command Reference

### Generate Secrets
```bash
npm run generate:secrets
```

### Database
```bash
npx prisma migrate deploy    # Run migrations
npx prisma studio           # Open database browser
npx prisma db pull          # Verify connection
```

### Environment Validation
```bash
npm run build               # Validates all environment variables
```

### Testing
```bash
npm test                    # Run test suite
npm run lint               # Run linter
```

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Maintained by:** Minalesh Development Team
