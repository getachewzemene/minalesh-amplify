# Production Launch Quick Reference

**Status:** Ready for Beta Launch  
**Timeline:** 1-2 weeks  
**Current Completion:** 98%

---

## ✅ What's Complete

**All core features are implemented!** See [BETA_RELEASE_SCAN_SUMMARY.md](BETA_RELEASE_SCAN_SUMMARY.md) for details.

- 99 out of 106 features fully implemented
- Only configuration needed (no new code)
- Comprehensive testing infrastructure in place
- Production-grade security and monitoring

---

## 🔧 Configuration Needed (1 Week)

### Day 1-2: Environment Setup

#### 1. Database Configuration
```bash
# Production PostgreSQL with connection pooling
DATABASE_URL="postgresql://user:password@host:6543/dbname?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
```

**Recommended Providers:**
- Supabase (easiest, has free tier)
- Neon (serverless, auto-scaling)
- See [docs/PRODUCTION_DATABASE_SETUP.md](docs/PRODUCTION_DATABASE_SETUP.md)

#### 2. Generate Secrets
```bash
# Generate strong secrets (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

#### 3. Email Service
```bash
# Sign up at https://resend.com (free tier available)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

**Setup Steps:**
1. Create Resend account
2. Verify your domain
3. Get API key from dashboard

---

### Day 3-4: SMS Notifications

#### Africa's Talking (Recommended for Ethiopia)
```bash
SMS_PROVIDER="africas_talking"
AFRICAS_TALKING_USERNAME="your_username"
AFRICAS_TALKING_API_KEY="your_production_api_key"
AFRICAS_TALKING_SHORT_CODE="MINALESH"  # Optional custom sender ID
```

**Setup Steps:**
1. Sign up at [africastalking.com](https://africastalking.com)
2. Complete business verification
3. Add credit (recommend ETB 5,000-10,000 for initial testing)
4. Get API credentials from dashboard
5. Optional: Request custom sender ID (takes 1-3 days)

**Alternative: Twilio**
```bash
SMS_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
```

**Cost Estimate:**
- Africa's Talking: ~ETB 0.80 per SMS
- Twilio: ~$0.05 USD per SMS

---

### Day 5-7: Payment Gateways

#### Stripe (International - Already Integrated)
```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Setup Steps:**
1. Switch from test to live mode in Stripe Dashboard
2. Configure webhook: `https://yourdomain.com/api/payments/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

#### Ethiopian Payment Providers (Optional)

**TeleBirr:**
```bash
TELEBIRR_API_KEY="your_production_api_key"
TELEBIRR_WEBHOOK_SECRET="your_webhook_secret"
```
- Contact: [ethiotelecom.et/telebirr-business](https://www.ethiotelecom.et/telebirr-business/)

**CBE Birr:**
```bash
CBE_API_KEY="your_production_api_key"
CBE_WEBHOOK_SECRET="your_webhook_secret"
```
- Contact: [combanketh.et](https://www.combanketh.et)

**Awash Bank:**
```bash
AWASH_API_KEY="your_production_api_key"
AWASH_WEBHOOK_SECRET="your_webhook_secret"
```
- Contact your Awash Bank relationship manager

**Note:** Merchant account approval takes 3-5 business days.

---

### Day 5-6: Monitoring & Observability

#### Sentry (Recommended - Free tier available)
```bash
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_AUTH_TOKEN="..."  # For source maps
```

**Setup Steps:**
1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Next.js)
3. Copy DSN from project settings
4. Configure alerts (email, Slack)

**Alternative: New Relic**
```bash
NEW_RELIC_LICENSE_KEY="your_license_key"
NEW_RELIC_APP_NAME="minalesh-marketplace"
```

**Alternative: Datadog**
```bash
DD_API_KEY="your_api_key"
DD_SERVICE="minalesh"
DD_ENV="production"
```

#### Uptime Monitoring
- Sign up for [UptimeRobot](https://uptimerobot.com) (free)
- Monitor: `https://yourdomain.com/api/health`
- Configure alerts: Email, Slack, SMS

---

### Optional: Media Storage (Can Use Local Initially)

#### AWS S3
```bash
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="minalesh-media"
```

#### Supabase Storage (Alternative)
```bash
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."
```

---

## 📋 Complete Environment Variables Checklist

### Required for Launch

```bash
# Database
DATABASE_URL=
DIRECT_URL=  # For Prisma migrations

# Security
JWT_SECRET=
CRON_SECRET=
NEXTAUTH_SECRET=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Payment (Minimum: Stripe)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# SMS (Choose one provider)
SMS_PROVIDER=
AFRICAS_TALKING_USERNAME=
AFRICAS_TALKING_API_KEY=
# OR
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Monitoring (Minimum: Sentry)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App Config
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
LOG_LEVEL=info
```

### Optional (Recommended for Full Features)

```bash
# Ethiopian Payment Providers
TELEBIRR_API_KEY=
CBE_API_KEY=
AWASH_API_KEY=

# Advanced Monitoring
NEW_RELIC_LICENSE_KEY=
DD_API_KEY=

# Media Storage (S3 or Supabase)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
# OR
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_FB_PIXEL_ID=
```

---

## 🧪 Testing Checklist

### Before Production Deployment

- [ ] **Database Setup**
  - [ ] Production database provisioned
  - [ ] Migrations applied: `npx prisma migrate deploy`
  - [ ] Categories seeded: `npm run db:seed:categories`
  - [ ] Shipping/tax seeded: `npm run db:seed:shipping-tax`
  - [ ] Admin user created: `npm run init:admin`

- [ ] **Build & Deploy**
  - [ ] Build passes: `npm run build`
  - [ ] No TypeScript errors
  - [ ] All tests pass: `npm run test`
  - [ ] Lint passes: `npm run lint`

- [ ] **Critical Flows**
  - [ ] User registration and email verification
  - [ ] Login and authentication
  - [ ] Browse products and search
  - [ ] Add to cart and checkout
  - [ ] Payment processing (test mode first!)
  - [ ] Order confirmation email
  - [ ] Order status SMS

- [ ] **Admin Functions**
  - [ ] Admin login works
  - [ ] Product CRUD operations
  - [ ] Order management
  - [ ] Vendor approval
  - [ ] Analytics dashboard loads

- [ ] **Integrations**
  - [ ] Email delivery (Resend)
  - [ ] SMS delivery (Africa's Talking/Twilio)
  - [ ] Payment webhook (Stripe)
  - [ ] Error tracking (Sentry)
  - [ ] Health check: `/api/health`

---

## 🚀 Deployment Steps

### Step 1: Staging Deployment

1. **Deploy to Vercel/AWS Amplify**
   ```bash
   # Connect repository
   # Set environment variables
   # Deploy
   ```

2. **Run smoke tests**
   - Create test account
   - Make test purchase (use Stripe test mode)
   - Verify email and SMS
   - Check admin dashboard

3. **Load testing** (optional but recommended)
   - Use k6 or Artillery
   - Test 100+ concurrent users
   - Monitor response times

### Step 2: Production Deployment

1. **Switch to production keys**
   - Stripe: Live mode
   - SMS: Production credentials
   - All other services: Production mode

2. **Deploy to production**
   - Final code push
   - Environment variables set
   - Domain configured with SSL

3. **Immediate verification**
   - [ ] Homepage loads
   - [ ] API health check: `/api/health`
   - [ ] Can create account
   - [ ] Can browse products
   - [ ] Can add to cart

4. **Monitor first 24 hours**
   - Watch error rates in Sentry
   - Check Uptime monitoring
   - Review first real orders
   - Monitor database performance

---

## 📊 Post-Launch Monitoring

### Daily (First Week)

- Check Sentry for errors
- Review Uptime monitoring
- Monitor conversion rates
- Check database performance: `/api/health/db?detailed=true`
- Review customer support tickets

### Weekly (First Month)

- Analyze user behavior (Google Analytics)
- Review sales metrics
- Check vendor payouts
- Optimize slow queries
- Plan feature enhancements based on feedback

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors:**
- Check `DATABASE_URL` has correct connection pooling
- Verify SSL is enabled for production
- Check firewall allows connections

**Email Not Sending:**
- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend
- Review email queue: Check `EmailQueue` table

**SMS Not Sending:**
- Verify SMS provider credentials
- Check account balance (Africa's Talking)
- Review `SmsNotification` table for errors

**Payment Webhook Failures:**
- Verify webhook endpoint is publicly accessible
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Review webhook logs in Stripe Dashboard
- Check `WebhookEvent` table

**Performance Issues:**
- Enable database connection pooling
- Check slow queries in logs
- Consider Redis caching (optional enhancement)
- Monitor with New Relic/Datadog

---

## 📞 Support & Resources

### Documentation
- [Beta Release Checklist](BETA_RELEASE_CHECKLIST.md) - Full feature status
- [Scan Summary](BETA_RELEASE_SCAN_SUMMARY.md) - Detailed analysis
- [Production Database Setup](docs/PRODUCTION_DATABASE_SETUP.md)
- [Production Deployment Quickstart](docs/PRODUCTION_DEPLOYMENT_QUICKSTART.md)
- [Security & RBAC](docs/SECURITY_AND_RBAC.md)

### API Documentation
- Interactive: `https://yourdomain.com/api-docs`
- Swagger JSON: `https://yourdomain.com/api/swagger.json`

### Health Checks
- Basic: `https://yourdomain.com/api/health`
- Detailed: `https://yourdomain.com/api/health/db?detailed=true`

### Support Channels
- GitHub Issues: Report bugs or request features
- Email: Set up support email
- Discord/Slack: Community support (if applicable)

---

## 🎯 Success Metrics

### Week 1 Targets
- [ ] 0 critical errors in Sentry
- [ ] >99% uptime
- [ ] <2s average page load time
- [ ] >50% checkout completion rate
- [ ] 100% payment success rate

### Month 1 Targets
- [ ] 100+ registered users
- [ ] 50+ completed orders
- [ ] 10+ active vendors
- [ ] <1% error rate
- [ ] >95% customer satisfaction

---

## 🔄 Post-Launch Enhancements

Based on user feedback, consider:

1. **SEO Improvements** (Week 2-3)
   - JSON-LD structured data
   - Open Graph images
   - Meta descriptions

2. **Real-time Features** (Month 2)
   - Live chat/messaging
   - Push notifications
   - Real-time inventory updates

3. **Advanced Analytics** (Month 2)
   - A/B testing framework
   - Funnel analysis improvements
   - Cohort retention dashboard

4. **Mobile App** (Month 3-4)
   - React Native app
   - Push notifications
   - Offline support

---

**Timeline Summary:**
- **Day 1-2:** Environment setup
- **Day 3-4:** SMS provider
- **Day 5-7:** Payment gateways + monitoring
- **Week 2:** Testing + deployment
- **Week 3+:** Monitor and optimize

**Target Beta Launch:** February 5, 2026

**Current Status:** ✅ 98% Ready - Configuration Phase

---

**Last Updated:** January 24, 2026  
**Document Owner:** Development Team
