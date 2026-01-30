# Email Marketing Campaigns - Quick Testing Guide

## Prerequisites

Ensure these environment variables are set:
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@minalesh.et
CRON_SECRET=your-secure-random-string
NEXT_PUBLIC_APP_URL=https://minalesh.et
```

## Test Each Campaign

### 1. Welcome Series Email ✉️

**Automated:** Sent when user verifies email

**Test Steps:**
```bash
# 1. Register a new user
curl -X POST https://your-app.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Verify email using token from email
curl -X POST https://your-app.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "EMAIL_VERIFICATION_TOKEN"}'

# 3. Check email queue for welcome email
# Expected: Welcome series email queued
```

**Expected Result:** User receives welcome email with platform introduction

---

### 2. Abandoned Cart Email 🛒

**Automated:** Cron runs hourly

**Test Steps:**
```bash
# 1. Add items to cart as logged-in user
# 2. Wait 24 hours OR manually adjust cart updatedAt timestamp in database:
UPDATE cart 
SET updated_at = NOW() - INTERVAL '25 hours' 
WHERE user_id = 'USER_ID';

# 3. Manually trigger cron job
curl -X POST https://your-app.com/api/cron/send-abandoned-cart-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 4. Check response
```

**Expected Response:**
```json
{
  "success": true,
  "emailsSent": 1,
  "usersProcessed": 1
}
```

---

### 3. Product Recommendations Email 🎯

**Manual Trigger:** Admin API

**Test Steps:**
```bash
# Send product recommendations to all users
curl -X POST https://your-app.com/api/admin/email-campaigns/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignType": "product_recommendations",
    "recommendationsData": {
      "categoryId": "optional-category-id",
      "limit": 4
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "campaignType": "product_recommendations",
  "emailsSent": 50
}
```

---

### 4. Flash Sale Alert Email 🔥

**Manual Trigger:** Admin API

**Test Steps:**
```bash
curl -X POST https://your-app.com/api/admin/email-campaigns/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignType": "flash_sale",
    "flashSaleData": {
      "saleName": "Weekend Flash Sale",
      "discount": 30,
      "endsAt": "2026-01-25T23:59:59Z",
      "saleUrl": "https://minalesh.et/sales/weekend-flash-sale",
      "productIds": ["product-uuid-1", "product-uuid-2"]
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "campaignType": "flash_sale",
  "emailsSent": 100
}
```

---

### 5. Weekly Deals Digest Email 🎁

**Automated:** Cron runs weekly (Sunday midnight)

**Test Steps:**
```bash
# Manually trigger weekly digest
curl -X POST https://your-app.com/api/cron/send-weekly-deals-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "emailsSent": 200,
  "usersProcessed": 200,
  "dealsIncluded": 8
}
```

---

### 6. Post-Purchase Follow-up Email ⭐

**Automated:** Cron runs daily (10:00 AM)

**Test Steps:**
```bash
# 1. Create an order and mark it as delivered
# 2. Adjust order timestamp to 7 days ago:
UPDATE "Order" 
SET updated_at = NOW() - INTERVAL '7 days',
    status = 'delivered'
WHERE id = 'ORDER_ID';

# 3. Manually trigger cron job
curl -X POST https://your-app.com/api/cron/send-post-purchase-followup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "emailsSent": 5,
  "ordersProcessed": 5
}
```

---

### 7. Re-engagement Email 💜

**Automated:** Cron runs daily (9:00 AM)

**Test Steps:**
```bash
# 1. Create inactive user (no orders in 35 days):
UPDATE "User" 
SET created_at = NOW() - INTERVAL '35 days'
WHERE id = 'USER_ID';

# OR if user has orders:
UPDATE "Order" 
SET created_at = NOW() - INTERVAL '35 days'
WHERE user_id = 'USER_ID';

# 2. Manually trigger cron job
curl -X POST https://your-app.com/api/cron/send-reengagement-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "emailsSent": 10,
  "usersProcessed": 50
}
```

---

## Verify Email Queue

Check that emails are queued correctly:

```sql
-- View all marketing emails in queue
SELECT 
  id,
  to_address,
  subject,
  template,
  status,
  created_at
FROM email_queue 
WHERE template IN (
  'welcome_series',
  'abandoned_cart',
  'product_recommendations',
  'flash_sale_alert',
  'weekly_deals_digest',
  'post_purchase_followup',
  're_engagement'
)
ORDER BY created_at DESC
LIMIT 20;
```

## Monitor Email Processing

The email queue is processed every 2 minutes by `/api/cron/process-email-queue`.

Check processing status:

```sql
-- View email statistics
SELECT 
  template,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_sent
FROM email_queue 
GROUP BY template, status
ORDER BY template, status;
```

## User Preferences

Users can opt out of marketing emails:

```sql
-- Check user email preferences
SELECT 
  u.email,
  up.email_marketing
FROM "User" u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE u.email = 'test@example.com';

-- Opt user out of marketing emails
UPDATE user_preferences 
SET email_marketing = false 
WHERE user_id = 'USER_ID';
```

## Development Testing

For local development without actual email sending:

1. Emails will be logged to console
2. Marked as sent in the database
3. No actual emails sent unless RESEND_API_KEY is configured

Check console output:
```
📧 Email would be sent:
To: test@example.com
Subject: 🎉 Welcome to Minalesh - Your Ethiopian Marketplace!
---
Welcome to Minalesh, Test!
...
---
```

## Production Checklist

Before going live:

- [ ] RESEND_API_KEY configured
- [ ] EMAIL_FROM domain verified in Resend
- [ ] CRON_SECRET set and secure
- [ ] Cron jobs configured in vercel.json
- [ ] Test each campaign in staging
- [ ] Monitor email queue processing
- [ ] Set up email deliverability monitoring
- [ ] Review and test unsubscribe flow
- [ ] Ensure GDPR compliance

## Troubleshooting

### Emails not being sent

1. Check RESEND_API_KEY is valid
2. Verify email domain is verified
3. Check email queue for failed emails
4. Review application logs

### Cron jobs not running

1. Verify cron jobs in vercel.json
2. Check CRON_SECRET matches
3. Test manual trigger
4. Review Vercel cron logs

### Users not receiving emails

1. Check emailMarketing preference
2. Verify email is verified
3. Check spam folder
4. Review email queue status

## Support

For issues:
- Check `EMAIL_MARKETING_IMPLEMENTATION.md` for detailed documentation
- Review email queue table in database
- Check application logs
- Contact: dev@minalesh.et
