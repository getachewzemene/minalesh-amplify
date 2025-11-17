# Quick Start: Email Service

## What Was Implemented

The email service with queue, retry logic, and Resend integration is now complete. All other requirements (password reset, media uploads, search, coupons) were already implemented.

## Setup (5 minutes)

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_...`)

### 2. Configure Environment

Add to your `.env` file:

```bash
# Email Service (Required)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@minalesh.et"

# Cron Job (Required)
CRON_SECRET="generate-a-random-32-char-secret"
```

### 3. Run Database Migration

```bash
npx prisma migrate deploy
```

Or if developing locally:

```bash
npx prisma migrate dev --name add_email_queue
```

### 4. Set Up Cron Job

Choose one method:

**Option A: Vercel (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-email-queue",
    "schedule": "*/2 * * * *"
  }]
}
```

**Option B: Linux Cron**
```bash
crontab -e
# Add this line:
*/2 * * * * curl -X POST https://yourdomain.com/api/cron/process-email-queue -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Option C: External Service (EasyCron, etc.)**
- URL: `https://yourdomain.com/api/cron/process-email-queue`
- Method: POST
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Frequency: Every 2 minutes

### 5. Test It

```bash
# Test email queueing
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Manually trigger queue processing
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check your inbox!

## How It Works

```
Your Code → queueEmail() → Database → Cron Worker (every 2 min) → Resend → Email Delivered
                                           ↓ (if fails)
                                        Retry (up to 3x)
```

## Using in Your Code

### Send Order Confirmation

```typescript
import { queueEmail, createOrderConfirmationEmail } from '@/lib/email';

const template = createOrderConfirmationEmail(
  user.email,
  order.orderNumber,
  order.totalAmount.toString(),
  order.orderItems.map(item => ({
    name: item.product.name,
    quantity: item.quantity,
    price: Number(item.price)
  }))
);

await queueEmail(template);
```

### Send Custom Email

```typescript
import { queueEmail } from '@/lib/email';

await queueEmail({
  to: 'customer@example.com',
  subject: 'Welcome to Minalesh!',
  html: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  text: 'Welcome! Thank you for joining us.',
  template: 'welcome', // optional, for tracking
  metadata: { userId: '123' } // optional
});
```

## Monitoring

### Check Queue Status

```typescript
import prisma from '@/lib/prisma';

const stats = await prisma.emailQueue.groupBy({
  by: ['status'],
  _count: true,
});

console.log(stats);
// [
//   { status: 'pending', _count: 5 },
//   { status: 'sent', _count: 120 },
//   { status: 'failed', _count: 2 }
// ]
```

### View Failed Emails

```typescript
const failed = await prisma.emailQueue.findMany({
  where: { status: 'failed' },
  select: {
    to: true,
    subject: true,
    lastError: true,
    attempts: true
  }
});
```

## Production Checklist

- [ ] Sign up for Resend account
- [ ] Add `RESEND_API_KEY` to production environment
- [ ] Verify domain in Resend (required for production)
- [ ] Add `CRON_SECRET` to production environment
- [ ] Configure cron job (every 1-5 minutes)
- [ ] Run database migration
- [ ] Test email sending
- [ ] Monitor for failed emails

## Troubleshooting

### Emails Not Sending?

1. **Check API key**: `echo $RESEND_API_KEY`
2. **Verify domain**: In Resend dashboard
3. **Check queue**: `SELECT COUNT(*) FROM email_queue WHERE status='pending'`
4. **Check cron**: Is it running? Check logs
5. **View errors**: `SELECT last_error FROM email_queue WHERE status='failed'`

### Development Mode

In development (NODE_ENV !== 'production'), emails are logged to console instead of being sent. This is normal and expected.

To test real email sending in development:
```bash
# Temporarily set production mode
NODE_ENV=production npm run dev
```

## Need Help?

- 📚 Full documentation: `docs/EMAIL_SERVICE.md`
- 🔍 Search tests for examples: `src/__tests__/email-queue.test.ts`
- 📖 Implementation summary: `CUSTOMER_EXPERIENCE_IMPLEMENTATION.md`

## What's Already Working

You don't need to set up these - they're already implemented:

- ✅ **Password Reset** - `/api/auth/password-reset/request`
- ✅ **Email Verification** - `/api/auth/verify-email`
- ✅ **Media Uploads** - `/api/media` with S3
- ✅ **Search** - `/api/products/search` with full-text
- ✅ **Coupons** - `/api/coupons/validate`

All of these now use the new email queue system automatically!

---

**Need more details?** See `docs/EMAIL_SERVICE.md` for comprehensive documentation.
