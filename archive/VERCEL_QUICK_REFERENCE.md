# Vercel Deployment - Quick Reference Card

**Deploy Minalesh Marketplace to Vercel in 20 minutes**

---

## Prerequisites Checklist

- [ ] GitHub repository ready
- [ ] Vercel account (free) - [Sign up](https://vercel.com)
- [ ] Domain name (.com) - ~$10/year from [Namecheap](https://namecheap.com) or [GoDaddy](https://godaddy.com)
- [ ] Supabase account (free) - [Sign up](https://supabase.com)
- [ ] Resend account (free) - [Sign up](https://resend.com) [Optional]
- [ ] Stripe account - [Sign up](https://stripe.com) [Optional]

**Total Cost**: $10/year (domain only)

---

## Deployment Steps

### 1. Import to Vercel (2 minutes)

```
1. Go to: https://vercel.com/new
2. Click: "Import Git Repository"
3. Select: getachewzemene/minalesh-amplify
4. Click: "Import"
```

### 2. Setup Database (5 minutes)

**Supabase**:
```
1. Create project at: https://app.supabase.com
2. Name: minalesh-marketplace
3. Password: (save securely)
4. Region: EU West (London) - closest to Ethiopia
5. Wait 2 minutes for provisioning
```

**Get Connection Strings**:
```
Settings → Database → Connection string

Pooler (for DATABASE_URL):
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1

Direct (for DIRECT_URL):
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 3. Configure Vercel Environment Variables (5 minutes)

**Required (Minimum)**:
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=<run: openssl rand -base64 32>
CRON_SECRET=<run: openssl rand -base64 16>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

**Recommended (Email)**:
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

**How to Add**:
```
Vercel Dashboard → Your Project → Settings → Environment Variables
Add each variable:
- Key: DATABASE_URL
- Value: [paste value]
- Environment: All (Production, Preview, Development)
Click "Save"
```

### 4. Deploy (3 minutes)

```
1. Click: "Deploy" button
2. Wait: 2-5 minutes for build
3. Result: Live at https://your-project.vercel.app
```

### 5. Run Database Migrations (3 minutes)

**Option A - Vercel CLI**:
```bash
npm i -g vercel
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B - Supabase SQL Editor**:
```
1. Go to: Supabase Dashboard → SQL Editor
2. Run:
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
3. Copy all migration files from prisma/migrations/
4. Execute each migration.sql in order
```

### 6. Initialize Admin (2 minutes)

```bash
vercel env pull .env.local
npm run init:admin

# Follow prompts:
# Email: admin@yourdomain.com
# Password: [min 8 chars]
# Name: [your name]
```

### 7. Add Custom Domain (5 minutes)

**In Vercel**:
```
Settings → Domains → Add
Enter: yourdomain.com
Click: "Add"
```

**In Domain Registrar** (Namecheap/GoDaddy):

**Option A - Nameservers (Easiest)**:
```
Custom DNS:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Option B - A/CNAME Records**:
```
A Record:
Type: A
Host: @
Value: 76.76.21.21

CNAME Record:
Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

**Verify**:
```
Wait: 5 min - 48 hours (usually < 1 hour)
Check: Settings → Domains (green checkmark)
SSL: Automatic (Vercel provisions)
```

---

## Post-Deployment

### Configure Webhooks

**Stripe** (if using payments):
```
1. Dashboard: https://dashboard.stripe.com/webhooks
2. Add endpoint: https://yourdomain.com/api/payments/webhook
3. Events: payment_intent.succeeded, payment_intent.payment_failed
4. Copy: Signing secret
5. Add to Vercel env: STRIPE_WEBHOOK_SECRET
```

### Verify Cron Jobs

```
Vercel Dashboard → Cron Jobs
Should see 11 jobs:
- process-email-queue (*/2 * * * *)
- collect-metrics (*/5 * * * *)
- retry-webhooks (*/10 * * * *)
- cleanup-reservations (*/5 * * * *)
- etc.
```

### Test Deployment

```bash
# Health check
curl https://yourdomain.com/api/health/db

# Admin login
Visit: https://yourdomain.com/admin/login
Email: admin@yourdomain.com
Password: [your password]

# Register test user
Visit: https://yourdomain.com/auth/register
```

---

## Environment Variables Reference

### Critical (Must Have)
```bash
DATABASE_URL              # Supabase pooled connection
DIRECT_URL                # Supabase direct connection
JWT_SECRET                # 32+ chars (openssl rand -base64 32)
CRON_SECRET               # 16+ chars (openssl rand -base64 16)
NEXT_PUBLIC_APP_URL       # https://yourdomain.com
NODE_ENV                  # production
```

### Recommended
```bash
RESEND_API_KEY            # Email service
EMAIL_FROM                # noreply@yourdomain.com
STRIPE_SECRET_KEY         # Payment processing
STRIPE_WEBHOOK_SECRET     # Webhook validation
SENTRY_DSN                # Error monitoring
```

### Optional
```bash
AWS_S3_BUCKET             # File storage
AWS_ACCESS_KEY_ID         # S3 credentials
AWS_SECRET_ACCESS_KEY     # S3 credentials
NEXT_PUBLIC_GA_MEASUREMENT_ID  # Google Analytics
SLACK_WEBHOOK_URL         # Alert notifications
```

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
Vercel Dashboard → Deployments → ... → Redeploy
Select: "Redeploy with existing Build Cache cleared"
```

### Database Connection Error
```bash
# Check:
1. DATABASE_URL has pgbouncer=true
2. DIRECT_URL uses port 5432
3. connection_limit=1 is set
4. Password is correct (no special chars causing issues)
```

### Domain Not Working
```bash
# Check:
1. DNS propagation: https://whatsmydns.net
2. Wait up to 48 hours (usually < 1 hour)
3. Try incognito mode (clear cache)
4. Verify DNS records are correct
```

### Cron Jobs Not Running
```bash
# Verify:
1. CRON_SECRET is set in Vercel env
2. Redeploy after adding CRON_SECRET
3. Check Vercel logs for cron execution
```

---

## Monitoring

### Vercel Analytics (Free)
```
Project → Analytics
- View page views
- Top pages
- Geographic distribution
- Real user metrics
```

### Uptime Monitoring (Free)
```
UptimeRobot: https://uptimerobot.com
Monitor: https://yourdomain.com/api/health/db
Alert: Email when down
```

### Error Tracking (Free)
```
Sentry: https://sentry.io
Add SENTRY_DSN to Vercel env
View errors in Sentry dashboard
```

---

## Costs

| Item | Cost | Tier |
|------|------|------|
| Domain | $10/year | - |
| Vercel | $0 | Hobby (100GB/month) |
| Supabase | $0 | Free (500MB DB) |
| Resend | $0 | Free (3K emails/month) |
| Sentry | $0 | Developer (5K errors/month) |
| **Total** | **$10/year** | **Less than $1/month!** |

### When to Upgrade

**Vercel Pro ($20/month)**:
- > 100GB bandwidth/month
- Need team collaboration
- Want password-protected previews

**Supabase Pro ($25/month)**:
- > 500MB database
- Need daily backups
- Want better performance

**Resend Pro ($20/month)**:
- > 3,000 emails/month

---

## Beta Features

Enable beta mode:
```bash
# In Vercel env vars
NEXT_PUBLIC_BETA_MODE=true
NEXT_PUBLIC_BETA_END_DATE=2026-04-01
```

Features:
- ✅ Beta feedback widget
- ✅ Feature announcements
- ✅ Beta badge for users
- ✅ Priority support

---

## Support

### Documentation
- **Full Guide**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- **Beta Summary**: [BETA_LAUNCH_SUMMARY.md](./BETA_LAUNCH_SUMMARY.md)
- **Beta User Guide**: [BETA_USER_GUIDE.md](./BETA_USER_GUIDE.md)

### Community
- **Vercel**: [Discord](https://vercel.com/discord)
- **Supabase**: [Discord](https://discord.supabase.com)
- **GitHub**: [Issues](https://github.com/getachewzemene/minalesh-amplify/issues)

### Help
- Email: support@yourdomain.com
- Twitter: @MinaleshMarket

---

## Success! 🎉

Your marketplace is now live at:
- **Main Site**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin/login
- **API Docs**: https://yourdomain.com/api-docs
- **Health Check**: https://yourdomain.com/api/health/db

**Next Steps**:
1. Login as admin
2. Invite beta testers
3. Monitor analytics
4. Collect feedback
5. Iterate and improve!

---

**Questions?** See the full [Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed explanations.
