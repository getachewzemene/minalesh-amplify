# Email Marketing Campaigns Implementation

## Overview

This implementation provides a comprehensive email marketing system with 7 automated campaigns designed to engage and retain customers on the Minalesh e-commerce platform.

## Implemented Campaigns

### 1. Welcome Series (New Users)
**Trigger:** Automatically sent when a user verifies their email
**Template:** `createWelcomeSeriesEmail`
**Integration:** `app/api/auth/verify-email/route.ts`

Features:
- Personalized greeting with user's first name
- Introduction to platform features
- Links to explore products and manage account
- Beautiful gradient header design

### 2. Abandoned Cart (24h After Abandonment)
**Trigger:** Cron job runs hourly to detect carts abandoned for 24 hours
**Template:** `createAbandonedCartEmail`
**Cron:** `app/api/cron/send-abandoned-cart-emails/route.ts`
**Schedule:** Every hour

Features:
- Shows cart items with images and prices
- Calculates total amount
- Urgency messaging to encourage completion
- Respects user email marketing preferences

### 3. Product Recommendations (Based on Browsing)
**Trigger:** Manually triggered by admin via API
**Template:** `createProductRecommendationsEmail`
**API:** `app/api/admin/email-campaigns/send/route.ts`

Features:
- Personalized recommendations based on wishlist
- Fallback to trending products
- Product images and prices
- Direct links to product pages

### 4. Flash Sale Alerts (Opted-in Users)
**Trigger:** Manually triggered by admin via API
**Template:** `createFlashSaleAlertEmail`
**API:** `app/api/admin/email-campaigns/send/route.ts`

Features:
- Eye-catching flash sale design with animations
- Customizable discount percentage
- Featured product listings
- Countdown timer
- Only sent to users who opted in

### 5. Weekly Deals Digest
**Trigger:** Cron job runs weekly
**Template:** `createWeeklyDealsDigestEmail`
**Cron:** `app/api/cron/send-weekly-deals-digest/route.ts`
**Schedule:** Weekly (Sunday at midnight)

Features:
- Curates top 8 deals from active promotions
- Falls back to featured products if no promotions
- Shows original and discounted prices
- Category information for each deal

### 6. Post-Purchase Follow-up (Review Request)
**Trigger:** Cron job runs daily to find orders delivered 7 days ago
**Template:** `createPostPurchaseFollowUpEmail`
**Cron:** `app/api/cron/send-post-purchase-followup/route.ts`
**Schedule:** Daily at 10:00 AM

Features:
- Sent 7 days after delivery
- Shows all products from the order
- Individual review links for each product
- Skips if user already reviewed all products
- Explains benefits of leaving reviews

### 7. Re-engagement (Inactive Users)
**Trigger:** Cron job runs daily to find users inactive for 30+ days
**Template:** `createReEngagementEmail`
**Cron:** `app/api/cron/send-reengagement-emails/route.ts`
**Schedule:** Daily at 9:00 AM

Features:
- Targets users inactive for 30-60 days
- Special welcome back offers
- Shows what's new since last visit
- Includes unsubscribe option

## Email Templates

All email templates are defined in `/src/lib/email.ts` with the following features:

- **Responsive HTML Design**: Works on desktop and mobile
- **Plain Text Version**: For accessibility and email clients that don't support HTML
- **Brand Consistency**: Uses Minalesh color scheme (#667eea, #764ba2, etc.)
- **Template Tracking**: Each email has a template name for analytics
- **Personalization**: Uses user's name and preferences
- **Professional Layouts**: Clean, modern design with proper spacing

## Cron Job Schedule

Add these to your `vercel.json` or equivalent cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-abandoned-cart-emails",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-weekly-deals-digest",
      "schedule": "0 0 * * 0"
    },
    {
      "path": "/api/cron/send-post-purchase-followup",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/send-reengagement-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## API Endpoints

### Send Flash Sale Campaign

```bash
POST /api/admin/email-campaigns/send
Authorization: Bearer <admin-token>

{
  "campaignType": "flash_sale",
  "flashSaleData": {
    "saleName": "Weekend Flash Sale",
    "discount": 30,
    "endsAt": "2024-01-20T23:59:59Z",
    "saleUrl": "https://minalesh.et/sales/weekend-flash-sale",
    "productIds": ["product-id-1", "product-id-2"]
  }
}
```

### Send Product Recommendations

```bash
POST /api/admin/email-campaigns/send
Authorization: Bearer <admin-token>

{
  "campaignType": "product_recommendations",
  "recommendationsData": {
    "categoryId": "optional-category-id",
    "limit": 4
  }
}
```

## User Preferences

The system respects user email marketing preferences:

- Users can opt-out via `UserPreferences.emailMarketing` field
- Only users with `emailMarketing: true` receive marketing emails
- Transactional emails (order confirmations, etc.) are always sent
- Users with unverified emails do not receive campaigns

## Email Queue System

All marketing emails use the existing email queue system:

- Emails are queued using `queueEmail()` function
- Processed by `/api/cron/process-email-queue` cron job
- Automatic retry on failure (up to 3 attempts)
- Supports scheduling for future delivery
- Prevents overwhelming the email service

## Testing

### Manual Testing

1. **Welcome Series**: Register a new user and verify email
2. **Abandoned Cart**: Add items to cart and wait 24 hours (or manually adjust timestamps)
3. **Product Recommendations**: Call API endpoint with admin token
4. **Flash Sale**: Call API endpoint with admin token
5. **Weekly Digest**: Trigger cron job manually with CRON_SECRET
6. **Post-Purchase**: Create an order, mark as delivered, adjust timestamp to 7 days ago
7. **Re-engagement**: Create a user, adjust last order timestamp to 35 days ago

### Trigger Cron Jobs Manually

```bash
# Abandoned cart emails
curl -X POST https://your-app.com/api/cron/send-abandoned-cart-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Weekly deals digest
curl -X POST https://your-app.com/api/cron/send-weekly-deals-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Post-purchase follow-up
curl -X POST https://your-app.com/api/cron/send-post-purchase-followup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Re-engagement emails
curl -X POST https://your-app.com/api/cron/send-reengagement-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Required environment variables:

```bash
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@minalesh.et

# Cron Security
CRON_SECRET=your-secure-random-string

# App URL
NEXT_PUBLIC_APP_URL=https://minalesh.et
```

## Monitoring

### Email Queue Metrics

```sql
-- Check email queue status
SELECT template, status, COUNT(*) 
FROM email_queue 
GROUP BY template, status;

-- View failed marketing emails
SELECT to_address, subject, last_error, attempts
FROM email_queue 
WHERE status = 'failed' 
  AND template IN ('welcome_series', 'abandoned_cart', 'product_recommendations', 
                    'flash_sale_alert', 'weekly_deals_digest', 
                    'post_purchase_followup', 're_engagement')
ORDER BY created_at DESC;
```

### Campaign Performance

```sql
-- Track sent campaigns
SELECT 
  DATE(sent_at) as date,
  template,
  COUNT(*) as emails_sent
FROM email_queue 
WHERE status = 'sent' 
  AND template LIKE '%campaign%'
GROUP BY DATE(sent_at), template
ORDER BY date DESC;
```

## Future Enhancements

1. **A/B Testing**: Test different email subject lines and content
2. **Click Tracking**: Track which links users click in emails
3. **Open Rate Tracking**: Monitor email open rates
4. **Dynamic Segmentation**: More sophisticated user segmentation
5. **Email Personalization**: Use AI to personalize product recommendations
6. **Triggered Campaigns**: Price drop alerts, back-in-stock notifications
7. **Email Analytics Dashboard**: Visual dashboard for campaign performance
8. **Multi-language Support**: Translate emails based on user language preference

## Best Practices

1. **Respect User Preferences**: Always check `emailMarketing` preference
2. **Rate Limiting**: Don't send too many emails to the same user
3. **Unsubscribe Links**: Include clear unsubscribe options
4. **Mobile Optimization**: All emails are mobile-responsive
5. **Testing**: Test emails before sending to large audiences
6. **Timing**: Send emails at optimal times (not late at night)
7. **Deliverability**: Monitor bounce rates and spam complaints
8. **Compliance**: Follow GDPR and email marketing regulations

## Troubleshooting

### Emails Not Sending

1. Check RESEND_API_KEY is configured correctly
2. Verify email queue is being processed (`/api/cron/process-email-queue`)
3. Check for failed emails in database
4. Verify CRON_SECRET matches for cron jobs

### Cron Jobs Not Running

1. Verify cron jobs are configured in `vercel.json`
2. Check cron secret authorization
3. Review application logs for errors
4. Manually trigger cron job to test

### Users Not Receiving Emails

1. Verify user has verified email address
2. Check `emailMarketing` preference is true
3. Confirm user meets campaign criteria (e.g., inactive for 30 days)
4. Check email queue for pending/failed emails

## Support

For issues or questions:
- Check logs: Application logs and email queue
- Review code: All email templates in `/src/lib/email.ts`
- Database queries: Monitor email_queue table
- Contact: dev@minalesh.et

---

**Last Updated:** January 2026
**Version:** 1.0
