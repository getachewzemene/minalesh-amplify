# Production Deployment Quick Start

This guide provides step-by-step instructions for deploying Minalesh marketplace to production with a PostgreSQL database.

## Prerequisites

- [ ] Domain name registered
- [ ] GitHub repository access
- [ ] Credit card for cloud services (if applicable)
- [ ] Access to deployment platform (Vercel/AWS Amplify)

## Step-by-Step Deployment

### 1. Choose Your Database Provider

We recommend **Supabase** for quick setup or **Neon** for serverless deployments.

#### Option A: Supabase (Recommended for MVP)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Enter project name: `minalesh-production`
   - Generate a strong database password (save it securely!)
   - Select region closest to your users (e.g., Frankfurt for Ethiopia)
   - Click "Create new project"

3. **Get Connection Strings**
   - Go to Settings → Database
   - Find "Connection string" section
   - Copy both URLs:
     ```bash
     # For migrations (Direct connection)
     DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require"
     
     # For runtime (Pooled connection)
     DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
     ```

4. **Configure Network Security**
   - Go to Settings → Database → Connection pooling
   - Under "Restrictions", add your deployment platform IPs
   - For Vercel: Use "Allow all" or add Vercel IPs from [vercel.com/docs/concepts/deployments/network](https://vercel.com/docs/concepts/deployments/network)

#### Option B: Neon (Recommended for Serverless)

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub

2. **Create Project**
   - Click "Create Project"
   - Name: `minalesh-production`
   - Select region (US East or EU Central)
   - PostgreSQL version: 15 or higher

3. **Get Connection String**
   - Copy the connection string from dashboard
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"
   ```

4. **No Additional Configuration Needed**
   - Neon has built-in connection pooling
   - Same URL for migrations and runtime

### 2. Generate Secrets

Generate secure secrets for your application:

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Cron Secret (16+ characters)
openssl rand -base64 16

# Save these securely - you'll need them in step 4
```

### 3. Deploy to Vercel

1. **Import Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **DO NOT deploy yet** - we need to set environment variables first

### 4. Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

#### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Database (from Step 1)
DATABASE_URL=[your-pooled-connection-url]
DIRECT_URL=[your-direct-connection-url]  # Only for Supabase

# Security (from Step 2)
JWT_SECRET=[your-generated-jwt-secret]
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
CRON_SECRET=[your-generated-cron-secret]

# Application URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

#### Optional but Recommended

```bash
# Email Service (Resend)
RESEND_API_KEY=[get-from-resend.com]
EMAIL_FROM=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com

# Error Tracking (Sentry)
SENTRY_DSN=[get-from-sentry.io]
SENTRY_ORG=your-org
SENTRY_PROJECT=minalesh

# Logging
LOG_LEVEL=info
```

### 5. Run Database Migrations

**Important:** Run migrations BEFORE deploying the application.

#### Option A: From Local Machine

```bash
# Install dependencies locally
npm install

# Set DATABASE_URL (use DIRECT_URL for Supabase)
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### Option B: From Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production.local

# Run migrations
npx prisma migrate deploy
```

### 6. Seed Production Data

Run these commands in order:

```bash
# 1. Seed Ethiopian categories
npx tsx prisma/seeds/categories.ts

# 2. Seed shipping zones and tax rates
npx tsx prisma/seeds/shipping-tax.ts

# 3. Create admin user (interactive)
npm run init:admin
# Follow prompts to create admin account
```

### 7. Deploy Application

Back in Vercel dashboard:

1. Click "Deploy" or trigger a new deployment
2. Wait for deployment to complete (~2-5 minutes)
3. Vercel will assign a temporary URL like `minalesh-xxx.vercel.app`

### 8. Configure Custom Domain

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain: `yourdomain.com`
3. Follow DNS configuration instructions
4. Add DNS records at your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. Wait for DNS propagation (5-60 minutes)

### 9. Set Up Cron Jobs

Vercel Pro plan includes cron jobs. Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/email-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/webhook-retry",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/inventory-cleanup",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Or use external cron service (free tier):**

1. Sign up at [cron-job.org](https://cron-job.org) or [easycron.com](https://www.easycron.com)
2. Create cron jobs with your CRON_SECRET:
   ```
   URL: https://yourdomain.com/api/cron/email-queue
   Header: Authorization: Bearer [CRON_SECRET]
   Schedule: Every 5 minutes
   ```

### 10. Verify Deployment

Test critical functionality:

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] API health check: `https://yourdomain.com/api/health`
- [ ] Database health: `https://yourdomain.com/api/health/db`
- [ ] User registration works
- [ ] Admin login works: `https://yourdomain.com/admin/login`
- [ ] Product browsing works
- [ ] Cart functionality works

### 11. Configure Monitoring

#### Sentry Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create new project for Next.js
3. Copy DSN and add to environment variables
4. Redeploy application
5. Test error tracking by causing an error

#### Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) (free):

1. Create account
2. Add monitor:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
3. Configure alerts (email, SMS, Slack)

#### Database Monitoring

For Supabase:
- Use built-in dashboard
- Set up email alerts for high connection usage

For Neon:
- Monitor via dashboard
- Set up alerts for unusual activity

### 12. Set Up Backups

#### Automated Backups

**Supabase:**
- Automatic daily backups (included)
- 7-day retention on free tier
- 30-day retention on Pro plan
- Enable PITR on Pro plan

**Neon:**
- Automatic continuous backups
- Point-in-time recovery available
- Create manual backups via dashboard

#### Manual Backup Script

Create a backup script and run weekly:

```bash
#!/bin/bash
# backup.sh

# Load environment variables
source .env.production

# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql

# Upload to S3 (optional)
# aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://your-backup-bucket/

echo "Backup completed"
```

Add to crontab:
```bash
0 3 * * 0 /path/to/backup.sh  # Every Sunday at 3 AM
```

### 13. Security Hardening

1. **Enable Vercel Web Application Firewall**
   - Go to Security → Firewall
   - Enable DDoS protection
   - Configure rate limiting

2. **Review Security Headers**
   - Already configured in `next.config.js`
   - Verify in browser DevTools

3. **Enable Audit Logging**
   - Monitor admin actions
   - Log authentication attempts
   - Track data exports

4. **Set Up SSL Monitoring**
   - Use [SSL Labs](https://www.ssllabs.com/ssltest/)
   - Verify A+ rating
   - Monitor certificate expiration

### 14. Performance Optimization

1. **Enable Vercel Analytics**
   - Go to Analytics tab
   - Review Core Web Vitals
   - Optimize slow pages

2. **Configure CDN Caching**
   - Already configured in `next.config.js`
   - Verify cache headers with browser DevTools

3. **Database Query Optimization**
   - Monitor slow queries in Supabase/Neon dashboard
   - Add indexes as needed
   - Use connection pooling (already configured)

4. **Image Optimization**
   - Next.js Image Optimization is automatic
   - Consider Cloudinary or Imgix for additional optimization

## Production Checklist

### Pre-Launch

- [ ] Database provisioned and configured
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Production data seeded
- [ ] Admin user created
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Cron jobs configured
- [ ] Monitoring and alerting set up
- [ ] Backups configured
- [ ] Error tracking enabled
- [ ] Load testing completed
- [ ] Security audit completed

### Post-Launch

- [ ] Verify all critical paths work
- [ ] Monitor error rates
- [ ] Check database connection pool
- [ ] Review application logs
- [ ] Test backup restoration
- [ ] Update documentation
- [ ] Train support team
- [ ] Announce launch

## Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**
```bash
# Solution: Add postinstall script
# package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

**Error: "Environment variable not found"**
- Verify all required variables are set in Vercel
- Check for typos in variable names
- Ensure variables are set for "Production" environment

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify DATABASE_URL is correct
- Check if database is running
- Verify network security settings (Supabase IP restrictions)
- Ensure SSL is required in connection string

**Error: "Too many connections"**
- Verify you're using pooled connection (port 6543 for Supabase)
- Add `?pgbouncer=true&connection_limit=1` to URL
- Check for connection leaks in code

### Deployment Errors

**Error: "Build exceeded maximum duration"**
- Check for slow database migrations
- Optimize build process
- Consider upgrading Vercel plan

**Error: "Function execution timed out"**
- Optimize database queries
- Add query timeouts
- Check for infinite loops

## Support

- **Documentation:** [Full Production Database Setup Guide](./PRODUCTION_DATABASE_SETUP.md)
- **Community:** GitHub Discussions
- **Email:** support@minalesh.et
- **Emergency:** [on-call contact]

## Next Steps

After successful deployment:

1. Set up payment gateways (Stripe, TeleBirr, etc.)
2. Configure email service (Resend)
3. Set up SMS notifications (Africa's Talking)
4. Configure S3 for image uploads
5. Enable multi-language support
6. Set up analytics (Google Analytics)
7. Create marketing campaigns
8. Launch beta to select users

---

**Estimated Time:** 2-4 hours  
**Difficulty:** Intermediate  
**Last Updated:** January 17, 2025
