# Email Service Documentation

## Overview

The Minalesh e-commerce platform includes a comprehensive email service with queuing, retry logic, and support for transactional emails via Resend. This service ensures reliable email delivery for critical operations like order confirmations, password resets, and shipping updates.

## Features

### ✅ Implemented Features

1. **Email Queue System**
   - Database-backed queue for reliable email delivery
   - Automatic retry on transient failures
   - Configurable max attempts (default: 3)
   - Scheduled email support

2. **Email Templates**
   - Order confirmation
   - Password reset
   - Email verification
   - Shipping updates

3. **Resend Integration**
   - Modern, reliable email service provider
   - Production-ready API
   - Comprehensive error handling

4. **Retry Logic**
   - Automatic retry on transient failures
   - Exponential backoff between attempts
   - Failure tracking and logging

5. **Background Processing**
   - Cron job for processing email queue
   - Batch processing (configurable batch size)
   - Real-time status tracking

## Architecture

```
┌─────────────┐
│ Application │
│   Code      │
└──────┬──────┘
       │
       │ queueEmail()
       ▼
┌─────────────┐
│  Email      │
│  Queue DB   │
└──────┬──────┘
       │
       │ Cron Job (every 1-5 min)
       ▼
┌─────────────┐
│  Email      │
│  Worker     │
└──────┬──────┘
       │
       │ Send via Resend
       ▼
┌─────────────┐
│   Resend    │
│    API      │
└─────────────┘
```

## Database Schema

```prisma
model EmailQueue {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  to            String
  subject       String
  html          String
  text          String
  template      String?
  metadata      Json?
  status        String    @default("pending") // pending, processing, sent, failed
  attempts      Int       @default(0)
  maxAttempts   Int       @default(3)
  lastError     String?
  lastAttemptAt DateTime?
  sentAt        DateTime?
  scheduledFor  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([status, scheduledFor])
  @@index([createdAt])
  @@map("email_queue")
}
```

## API Reference

### Core Functions

#### `queueEmail(template, scheduledFor?)`

Queue an email for asynchronous sending.

**Parameters:**
- `template`: EmailTemplate object
  - `to`: string - Recipient email address
  - `subject`: string - Email subject
  - `html`: string - HTML email body
  - `text`: string - Plain text email body
  - `template?`: string - Template name for tracking
  - `metadata?`: object - Additional metadata
- `scheduledFor?`: Date - Optional scheduled send time

**Returns:** Promise<string> - Email queue ID

**Example:**
```typescript
import { queueEmail } from '@/lib/email';

const emailId = await queueEmail({
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you for your order!</h1>',
  text: 'Thank you for your order!',
  template: 'order_confirmation',
  metadata: { orderId: '12345' }
});
```

#### `sendEmailImmediate(template)`

Send an email immediately, bypassing the queue.

**Use Cases:**
- Critical notifications requiring immediate delivery
- Time-sensitive alerts
- Testing and debugging

**Parameters:**
- `template`: EmailTemplate object (same as queueEmail)

**Returns:** Promise<boolean> - Success status

**Example:**
```typescript
import { sendEmailImmediate } from '@/lib/email';

const success = await sendEmailImmediate({
  to: 'admin@example.com',
  subject: 'Critical Alert',
  html: '<p>System issue detected</p>',
  text: 'System issue detected'
});
```

#### `processEmailQueue(batchSize?)`

Process pending emails from the queue. Called by the cron job.

**Parameters:**
- `batchSize?`: number - Number of emails to process (default: 10)

**Returns:** Promise<{processed, sent, failed}>

**Example:**
```typescript
import { processEmailQueue } from '@/lib/email';

const result = await processEmailQueue(20);
console.log(`Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`);
```

### Email Templates

#### Order Confirmation

```typescript
import { createOrderConfirmationEmail, queueEmail } from '@/lib/email';

const template = createOrderConfirmationEmail(
  'customer@example.com',
  'ORD-12345',
  '500.00',
  [
    { name: 'Product 1', quantity: 2, price: 100 },
    { name: 'Product 2', quantity: 1, price: 300 }
  ]
);

await queueEmail(template);
```

#### Password Reset

```typescript
import { createPasswordResetEmail, queueEmail } from '@/lib/email';

const template = createPasswordResetEmail(
  'user@example.com',
  'reset-token-here',
  'https://minalesh.et'
);

await queueEmail(template);
```

#### Email Verification

```typescript
import { createEmailVerificationEmail, queueEmail } from '@/lib/email';

const template = createEmailVerificationEmail(
  'newuser@example.com',
  'verification-token',
  'https://minalesh.et'
);

await queueEmail(template);
```

#### Shipping Update

```typescript
import { createShippingUpdateEmail, queueEmail } from '@/lib/email';

const template = createShippingUpdateEmail(
  'customer@example.com',
  'ORD-12345',
  'shipped',
  'TRACK-123456' // optional tracking number
);

await queueEmail(template);
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required for production email sending
RESEND_API_KEY="re_..."  # Get from https://resend.com/api-keys
EMAIL_FROM="noreply@minalesh.et"

# Required for cron job authentication
CRON_SECRET="your-secure-cron-secret"
```

### Getting a Resend API Key

1. Sign up at [Resend.com](https://resend.com)
2. Verify your domain (required for production)
3. Generate an API key in the dashboard
4. Add the API key to your environment variables

## Cron Job Setup

The email queue worker should run every 1-5 minutes to process pending emails.

### Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

### Manual Cron (Linux/Unix)

```bash
*/2 * * * * curl -X GET https://your-domain.com/api/cron/process-email-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Testing the Cron Job

```bash
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Email Lifecycle

### 1. Queued
- Email added to database with status: `pending`
- Scheduled for immediate or future delivery
- Awaits processing by worker

### 2. Processing
- Worker picks up email
- Status changed to: `processing`
- Attempt counter incremented

### 3. Sent
- Successfully delivered via Resend
- Status changed to: `sent`
- `sentAt` timestamp recorded

### 4. Failed (with retry)
- Transient failure detected
- Status remains: `pending`
- Will retry on next worker run
- `lastError` recorded for debugging

### 5. Failed (permanent)
- Max attempts reached (default: 3)
- Status changed to: `failed`
- Manual intervention may be needed

## Retry Strategy

```
Attempt 1 → Immediate
Attempt 2 → Next cron run (1-5 min later)
Attempt 3 → Next cron run (1-5 min later)
Attempt 4+ → Failed permanently
```

### Transient Failures (Automatic Retry)
- Network timeouts
- API rate limits
- Temporary service outages
- 5xx server errors

### Permanent Failures (No Retry After Max Attempts)
- Invalid email addresses
- Blacklisted recipients
- Domain validation failures
- 4xx client errors

## Monitoring

### Queue Status Query

```typescript
import prisma from '@/lib/prisma';

// Get queue statistics
const stats = await prisma.emailQueue.groupBy({
  by: ['status'],
  _count: true,
});

console.log(stats);
// Output: [
//   { status: 'pending', _count: 5 },
//   { status: 'sent', _count: 120 },
//   { status: 'failed', _count: 2 }
// ]
```

### Failed Emails Query

```typescript
import prisma from '@/lib/prisma';

// Get failed emails
const failedEmails = await prisma.emailQueue.findMany({
  where: { status: 'failed' },
  orderBy: { updatedAt: 'desc' },
  take: 10,
});

failedEmails.forEach(email => {
  console.log(`Failed: ${email.to} - ${email.lastError}`);
});
```

### Pending Emails Query

```typescript
import prisma from '@/lib/prisma';

// Get pending emails count
const pendingCount = await prisma.emailQueue.count({
  where: { status: 'pending' },
});

console.log(`Pending emails: ${pendingCount}`);
```

## Performance Considerations

### Database Indexes
The schema includes indexes for optimal query performance:
- `[status, scheduledFor]` - Fast queue processing
- `[createdAt]` - Historical analysis

### Batch Processing
- Default batch size: 10 emails per run
- Adjustable based on volume: `processEmailQueue(50)`
- Cron frequency: Every 1-5 minutes

### Expected Throughput
- **Low Volume**: <100 emails/day - Run cron every 5 minutes
- **Medium Volume**: 100-1000 emails/day - Run cron every 2 minutes  
- **High Volume**: >1000 emails/day - Run cron every minute + increase batch size

## Error Handling

### Application Errors
All functions include try-catch blocks and log errors via the logger:

```typescript
try {
  await queueEmail(template);
} catch (error) {
  console.error('Failed to queue email:', error);
  // Handle gracefully - app continues to work
}
```

### Email Sending Errors
The worker automatically handles errors:
- Logs error details
- Updates `lastError` field
- Retries if attempts < maxAttempts
- Marks as failed if max attempts reached

## Security

### API Key Protection
- Store `RESEND_API_KEY` securely in environment variables
- Never commit API keys to version control
- Use different keys for development/staging/production

### Cron Job Authentication
- Protect cron endpoint with `CRON_SECRET`
- Use strong, random secret (at least 32 characters)
- Rotate secret periodically

### Email Content
- Sanitize user input in email templates
- Use HTML escaping for dynamic content
- Validate email addresses before queuing

## Testing

### Development Mode
In development, emails are logged to console instead of being sent:

```
📧 Email would be sent:
To: test@example.com
Subject: Test Email
---
Email content here
---
```

### Manual Testing

```typescript
// Queue a test email
import { queueEmail } from '@/lib/email';

await queueEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<h1>This is a test</h1>',
  text: 'This is a test'
});

// Process the queue manually
import { processEmailQueue } from '@/lib/email';
const result = await processEmailQueue(1);
console.log(result);
```

### Unit Tests

Run the test suite:

```bash
npm test src/__tests__/email-queue.test.ts
```

## Troubleshooting

### Emails Not Being Sent

1. **Check Resend API Key**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Verify Domain**
   - Log into Resend dashboard
   - Ensure domain is verified
   - Check DNS records

3. **Check Queue Status**
   ```sql
   SELECT status, COUNT(*) FROM email_queue GROUP BY status;
   ```

4. **Check Cron Job**
   - Verify CRON_SECRET is set
   - Test endpoint manually
   - Check cron job logs

### High Failure Rate

1. **Check Resend Status**
   - Visit [Resend Status Page](https://status.resend.com)

2. **Review Error Messages**
   ```typescript
   const failed = await prisma.emailQueue.findMany({
     where: { status: 'failed' },
     select: { to: true, lastError: true, attempts: true }
   });
   ```

3. **Increase Max Attempts**
   Update schema or adjust per email:
   ```typescript
   await prisma.emailQueue.create({
     data: {
       // ... other fields
       maxAttempts: 5 // Increase from default 3
     }
   });
   ```

### Queue Growing Too Large

1. **Increase Cron Frequency**
   - Run every 1 minute instead of 5
   
2. **Increase Batch Size**
   ```typescript
   await processEmailQueue(50); // Process more emails per run
   ```

3. **Add More Workers**
   - Deploy multiple instances
   - Ensure database locking prevents duplicate sends

## Migration Guide

### From Console Logging to Resend

The email service is backward compatible. Existing calls to `sendEmail()` now automatically use the queue:

```typescript
// Old code (still works)
import { sendEmail } from '@/lib/email';
await sendEmail(template);

// New code (explicit queuing)
import { queueEmail } from '@/lib/email';
await queueEmail(template);
```

### Setting Up Production

1. **Get Resend API Key**
   ```bash
   # Add to .env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="noreply@yourdomain.com"
   ```

2. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name add_email_queue
   ```

3. **Deploy Application**
   ```bash
   git push origin main
   ```

4. **Configure Cron Job**
   - Add cron configuration to hosting platform
   - Or set up external cron service

5. **Test Email Sending**
   ```bash
   # Queue a test email
   curl -X POST https://your-api.com/api/auth/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   
   # Trigger cron job
   curl -X POST https://your-api.com/api/cron/process-email-queue \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Best Practices

1. **Always Use Queue for Non-Critical Emails**
   - Order confirmations
   - Shipping updates
   - Promotional emails

2. **Use Immediate Send for Critical Alerts**
   - System failures
   - Security alerts
   - Time-sensitive notifications

3. **Include Metadata for Tracking**
   ```typescript
   await queueEmail({
     // ... template fields
     metadata: {
       orderId: '12345',
       userId: 'user-123',
       emailType: 'order_confirmation'
     }
   });
   ```

4. **Monitor Queue Health**
   - Set up alerts for high pending count
   - Monitor failure rate
   - Track processing time

5. **Test Email Templates**
   - Use development mode for testing
   - Send test emails to team before production
   - Verify rendering across email clients

## Future Enhancements

Potential improvements for future releases:

- [ ] Email template management UI
- [ ] A/B testing for email content
- [ ] Email analytics (open rates, click rates)
- [ ] Bulk email campaigns
- [ ] Email preferences management
- [ ] Internationalization (i18n) support
- [ ] SMS notifications integration
- [ ] Push notifications
- [ ] Webhook notifications

## Support

For issues or questions:

1. Check this documentation
2. Review test files for examples
3. Check application logs
4. Consult [Resend Documentation](https://resend.com/docs)
5. Open an issue on GitHub

---

**Last Updated:** November 2024  
**Version:** 1.0.0
