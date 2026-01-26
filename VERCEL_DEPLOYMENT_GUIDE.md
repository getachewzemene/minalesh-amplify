# Vercel Deployment Guide - Minalesh Marketplace

This comprehensive guide will walk you through deploying the Minalesh Ethiopian Marketplace to Vercel for free with a custom .com domain.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Database Configuration](#database-configuration)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ **GitHub Account** - Your repository is already on GitHub
- ✅ **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
- ✅ **Domain Name** - Purchase a .com domain from providers like:
  - [Namecheap](https://www.namecheap.com) ($8-12/year)
  - [GoDaddy](https://www.godaddy.com) ($10-15/year)
  - [Google Domains](https://domains.google) ($12/year)
- ✅ **Database Provider** - Choose one:
  - [Supabase](https://supabase.com) (Free tier: 500MB)
  - [Neon](https://neon.tech) (Free tier: 512MB)
  - [PlanetScale](https://planetscale.com) (Free tier: 5GB)

### Required Services (for full functionality)
- **Email Service**: [Resend](https://resend.com) (Free tier: 3,000 emails/month)
- **Payment Gateway**: [Stripe](https://stripe.com) (Pay per transaction)
- **File Storage**: AWS S3 (Optional, can use Vercel Blob Storage)

---

## Quick Start Deployment

### Step 1: Prepare Your Repository

1. **Ensure your code is on GitHub**
   ```bash
   git status
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify `vercel.json` is configured** (already done ✅)
   - The repository includes a production-ready `vercel.json`
   - Includes security headers, cron jobs, and caching rules

### Step 2: Connect to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/new)**

2. **Import Your Repository**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose `getachewzemene/minalesh-amplify`
   - Click "Import"

3. **Configure Project Settings**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Add Environment Variables** (see next section)

5. **Click "Deploy"**
   - First deployment takes 2-5 minutes
   - Vercel automatically assigns a URL: `your-project.vercel.app`

---

## Environment Variables Configuration

### Critical Environment Variables (Minimum Required)

Add these in Vercel Dashboard → Settings → Environment Variables:

#### 1. Database Configuration
```bash
# Supabase (Recommended for Free Tier)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Neon (Alternative)
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
DIRECT_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

#### 2. Authentication & Security
```bash
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-CHANGE-THIS
CRON_SECRET=your-cron-secret-key-CHANGE-THIS
```

#### 3. Application URLs
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

### Optional but Recommended

#### Email Service (Resend)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com
CONTACT_PHONE=+251900000000
```

#### Payment Gateway (Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_REPLACE_WITH_YOUR_ACTUAL_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET
```

#### Error Monitoring (Sentry)
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### How to Add Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

**Important**: After adding environment variables, redeploy your application:
- Go to **Deployments** tab
- Click **⋯** on latest deployment → **Redeploy**

---

## Custom Domain Setup

### Step 1: Configure Domain in Vercel

1. **Open Vercel Dashboard**
   - Go to your project
   - Click **Settings** → **Domains**

2. **Add Your Domain**
   - Enter your domain: `yourdomain.com`
   - Click **Add**
   - Vercel will show DNS configuration instructions

### Step 2: Configure DNS Records

**Option A: Use Vercel Nameservers (Recommended - Easiest)**

1. Vercel will provide nameservers like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Find "Nameservers" or "DNS Settings"
   - Change nameservers to Vercel's nameservers
   - Save changes

3. Wait for DNS propagation (5 minutes - 48 hours, usually < 1 hour)

**Option B: Use CNAME/A Records**

If you want to keep your registrar's nameservers:

1. **For Root Domain** (`yourdomain.com`):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

2. **For WWW Subdomain** (`www.yourdomain.com`):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Step 3: Verify Domain

1. Go back to Vercel Dashboard → Domains
2. Click **Refresh** to check DNS propagation
3. Once verified, Vercel automatically provisions SSL certificate
4. Your site will be live at `https://yourdomain.com` (with SSL!)

### Step 4: Set Primary Domain

1. In Vercel → Settings → Domains
2. Click **⋯** next to your domain
3. Select **Set as Primary Domain**
4. This redirects `*.vercel.app` to your custom domain

---

## Database Configuration

### Recommended: Supabase (Free Tier)

#### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Fill in:
   - **Name**: minalesh-marketplace
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to Ethiopia (EU West - London recommended)
4. Click **Create new project** (takes ~2 minutes)

#### 2. Get Database Connection Strings

1. Go to **Settings** → **Database**
2. Find "Connection string" section
3. Copy both URLs:
   
   **Pooler Connection (for DATABASE_URL)**:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
   ```
   
   **Direct Connection (for DIRECT_URL)**:
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

4. Add to Vercel Environment Variables

#### 3. Enable Required Extensions

1. In Supabase Dashboard → **SQL Editor**
2. Run this SQL:
   ```sql
   -- Enable trigram extension for search
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

#### 4. Run Database Migrations

**Option A: From Local Development**
```bash
# Set environment variables locally
export DATABASE_URL="your-supabase-direct-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed Ethiopian categories (optional)
npx tsx prisma/seeds/categories.ts

# Initialize admin user
npm run init:admin
```

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Push database schema
vercel env add DIRECT_URL production
npx prisma db push
```

---

## Post-Deployment Setup

### 1. Initialize Admin User

After successful deployment, initialize the admin user:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run init:admin

# Or manually via SQL (in Supabase SQL Editor)
# See scripts/init-admin.ts for the structure
```

### 2. Configure Webhook URLs

Update webhook URLs in your service providers:

#### Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
4. **Events to send**: 
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** to Vercel env: `STRIPE_WEBHOOK_SECRET`

#### Email Webhook (Resend)
1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Add webhook: `https://yourdomain.com/api/webhooks/email`

### 3. Verify Cron Jobs

Vercel automatically sets up cron jobs from `vercel.json`:

1. Go to **Vercel Dashboard** → **Settings** → **Cron Jobs**
2. Verify all 11 cron jobs are listed and active:
   - Email queue processing (every 2 minutes)
   - Metrics collection (every 5 minutes)
   - Webhook retries (every 10 minutes)
   - etc.

### 4. Test Email Functionality

1. **Verify Domain in Resend**:
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain: `yourdomain.com`
   - Add DNS records provided by Resend
   - Wait for verification

2. **Test Email Sending**:
   - Register a new user on your site
   - Check if verification email arrives
   - Test password reset flow

### 5. Set Up Error Monitoring

#### Sentry Setup
1. Create account at [Sentry.io](https://sentry.io)
2. Create new project → Select "Next.js"
3. Copy DSN to Vercel environment variables
4. Deploy and test by triggering an error
5. Check Sentry dashboard for error reports

---

## Monitoring & Maintenance

### Vercel Analytics (Free)

1. Enable **Vercel Analytics**:
   - Go to project → **Analytics** tab
   - Click **Enable Analytics** (free for hobby plan)
   - View page views, top pages, and geographic distribution

2. Enable **Vercel Speed Insights**:
   - Monitors real user performance metrics
   - Shows Core Web Vitals (LCP, FID, CLS)

### Database Monitoring

1. **Supabase Dashboard**:
   - Monitor database size (500MB free tier limit)
   - Check connection pool usage
   - Review slow queries

2. **Health Check Endpoint**:
   - Access: `https://yourdomain.com/api/health/db`
   - Returns database status and metrics
   - Set up uptime monitoring with:
     - [UptimeRobot](https://uptimerobot.com) (free)
     - [Better Uptime](https://betteruptime.com) (free)

### Cost Monitoring

**Vercel Free Tier Limits**:
- ✅ Bandwidth: 100GB/month
- ✅ Builds: 6,000 minutes/month
- ✅ Serverless Function Execution: 100GB-hours
- ✅ Serverless Function Duration: 10s max
- ✅ Image Optimization: 1,000 source images

**Monitor Usage**:
1. Vercel Dashboard → **Usage** tab
2. Set up alerts before hitting limits
3. Upgrade to Pro ($20/month) if needed

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `Module not found` or dependency issues

**Solution**:
```bash
# Clear npm cache locally
npm cache clean --force

# Delete lock file and reinstall
rm -rf node_modules package-lock.json
npm install

# Commit and push
git add .
git commit -m "Fix dependencies"
git push
```

### Database Connection Errors

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` in Vercel environment variables
2. Ensure you're using **pooled connection** (port 6543 for Supabase)
3. Check `connection_limit=1` is set for serverless
4. Verify SSL mode: `?sslmode=require`

### Cron Jobs Not Running

**Error**: Cron jobs returning 401 Unauthorized

**Solution**:
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check cron endpoints have auth verification:
   ```typescript
   // In cron endpoint
   if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

### Domain Not Working

**Error**: Domain shows "This domain is not configured"

**Solution**:
1. Wait for DNS propagation (use [WhatsMyDNS](https://www.whatsmydns.net))
2. Verify DNS records are correct
3. Try removing and re-adding domain in Vercel
4. Clear browser cache and try incognito mode

### Image Optimization Errors

**Error**: Images not loading or optimization failing

**Solution**:
1. Verify image domains in `next.config.js`
2. Check image URLs are HTTPS
3. For S3 images, ensure bucket has proper CORS configuration
4. Use Vercel Image Optimization (handles AVIF/WebP automatically)

### Stripe Webhook Failures

**Error**: Payments successful but orders not updating

**Solution**:
1. Check Stripe webhook signing secret in Vercel env
2. Verify webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://yourdomain.com/api/payments/webhook
   ```
4. Check Vercel Function Logs for errors

---

## Production Checklist

Before going live with real users:

### Security
- [ ] `JWT_SECRET` is strong and unique (32+ characters)
- [ ] `CRON_SECRET` is set and secure
- [ ] All secrets are in Vercel environment variables (not in code)
- [ ] SSL certificate is active (Vercel provides automatically)
- [ ] Security headers configured (already in `vercel.json`)
- [ ] Database connection uses SSL (`sslmode=require`)

### Functionality
- [ ] Admin user created and can login
- [ ] Test user registration and email verification
- [ ] Test password reset flow
- [ ] Create test product and place test order
- [ ] Process test payment (use Stripe test mode)
- [ ] Verify webhook handling (Stripe, email, etc.)
- [ ] Test all user roles (admin, vendor, customer)

### Performance
- [ ] Images optimized and loading fast
- [ ] Core Web Vitals are good (check with Lighthouse)
- [ ] Database queries are efficient
- [ ] Caching headers configured (already in `vercel.json`)
- [ ] CDN enabled for static assets

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring set up
- [ ] Database metrics monitored
- [ ] Alert notifications configured (Slack, email)

### Legal
- [ ] Privacy Policy updated with correct domain
- [ ] Terms of Service updated
- [ ] Cookie consent banner active
- [ ] GDPR compliance verified
- [ ] Contact information updated

---

## Scaling Considerations

### When to Upgrade

**From Vercel Free → Pro ($20/month)**:
- Traffic exceeds 100GB bandwidth/month
- Need faster builds or more team members
- Require password-protected previews
- Need advanced analytics

**From Supabase Free → Pro ($25/month)**:
- Database exceeds 500MB
- Need more than 2GB storage
- Require daily backups
- Need better performance

### Optimization Tips

1. **Enable Incremental Static Regeneration (ISR)**:
   ```typescript
   // In page component
   export const revalidate = 3600; // Revalidate every hour
   ```

2. **Use Edge Functions for Auth**:
   - Move authentication to Edge Runtime
   - Reduces cold start latency
   - Better for global users

3. **Implement Redis Caching**:
   - Add Redis for hot data (products, categories)
   - Use Upstash Redis (free tier available)
   - Significantly reduces database load

4. **Image Optimization**:
   - Use Next.js Image component everywhere
   - Implement blur placeholders
   - Lazy load below-the-fold images

---

## Support Resources

### Documentation
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com)

### Paid Support
- Vercel Pro includes email support
- Enterprise plans include SLA and dedicated support

---

## Summary

Deploying Minalesh Marketplace to Vercel is straightforward:

1. **Sign up** for Vercel, Supabase, and domain registrar
2. **Import** repository from GitHub
3. **Configure** environment variables
4. **Deploy** with one click
5. **Add** custom domain via DNS
6. **Initialize** admin user and seed data
7. **Test** all functionality
8. **Monitor** with built-in analytics

**Total Cost for Beta Testing**:
- Domain: ~$10/year
- Vercel: Free
- Supabase: Free
- Resend Email: Free (up to 3,000/month)
- Stripe: Pay per transaction only

**Total: ~$10/year** for a full production deployment! 🎉

---

**Questions?** Open an issue on GitHub or contact support@yourdomain.com
