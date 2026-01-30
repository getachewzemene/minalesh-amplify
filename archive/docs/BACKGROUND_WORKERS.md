# Background Workers Documentation

This document describes the background workers implemented in the Minalesh application for processing asynchronous tasks.

## Overview

The application uses a simple Cron-based approach for background job processing. Three main workers handle:

1. **Email Queue Processing** - Sends pending emails via Resend
2. **Webhook Retry** - Retries failed webhook events
3. **Inventory Cleanup** - Releases expired inventory reservations

All workers are implemented as Next.js API routes and are secured using the `CRON_SECRET` environment variable.

## Architecture

### Pattern

Each worker follows this pattern:
- Exposed as a Next.js API route at `/api/cron/{worker-name}`
- Protected by `Bearer {CRON_SECRET}` authentication
- Supports both GET and POST methods for flexibility
- Processes a batch of items (configurable batch size)
- Returns JSON response with processing statistics

### Security

All cron endpoints require authentication:
```
Authorization: Bearer {CRON_SECRET}
```

The `CRON_SECRET` environment variable must be set and should be a strong, random value.

## Workers

### 1. Email Queue Worker

**Endpoint:** `GET/POST /api/cron/process-email-queue`

**Purpose:** Processes pending emails from the `EmailQueue` table and sends them via Resend.

**Configuration:**
- Batch size: 20 emails per run
- Max attempts: 3 (configurable per email)
- Scheduling: Run every 1-5 minutes

**Process:**
1. Fetches pending emails where:
   - `status = 'pending'`
   - `scheduledFor <= now()`
   - `attempts < maxAttempts`
2. Attempts to send each email via Resend
3. On success: marks as `sent`, updates `sentAt`
4. On failure: increments `attempts`, updates `lastError`
5. After max attempts: marks as `failed`

**Response:**
```json
{
  "success": true,
  "processed": 15,
  "sent": 14,
  "failed": 1
}
```

**Implementation:**
- Service: `src/lib/email.ts` - `processEmailQueue()`
- Route: `app/api/cron/process-email-queue/route.ts`
- Model: `EmailQueue` in `prisma/schema.prisma`

### 2. Webhook Retry Worker

**Endpoint:** `GET/POST /api/cron/retry-webhooks`

**Purpose:** Retries failed webhooks with exponential backoff to handle transient failures.

**Configuration:**
- Batch size: 10 webhooks per run
- Max retry attempts: 5
- Retry delays: 1min → 2min → 4min → 8min → 16min → 60min (max)
- Scheduling: Run every 5-10 minutes

**Process:**
1. Fetches failed webhooks where:
   - `status = 'error'`
   - `retryCount < 5`
   - `nextRetryAt <= now()` OR `nextRetryAt IS NULL`
   - `archived = false`
2. Attempts to reprocess each webhook
3. On success: marks as `processed`, updates `processedAt`
4. On failure: 
   - Increments `retryCount`
   - Calculates `nextRetryAt` using exponential backoff
   - Updates `errorMessage`
5. After max attempts: marks as `archived = true`

**Exponential Backoff:**
- Retry 1: 1 minute
- Retry 2: 2 minutes
- Retry 3: 4 minutes
- Retry 4: 8 minutes
- Retry 5: 16 minutes
- Maximum delay: 60 minutes

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "succeeded": 3,
  "failed": 2
}
```

**Implementation:**
- Service: `src/services/WebhookService.ts` - `retryFailedWebhooks()`
- Route: `app/api/cron/retry-webhooks/route.ts`
- Model: `WebhookEvent` in `prisma/schema.prisma`

**Note:** The webhook retry worker is primarily for recovering from transient failures (network issues, temporary service outages). Webhooks that fail due to business logic errors (amount mismatch, invalid data) may require manual intervention.

### 3. Inventory Cleanup Worker

**Endpoint:** `GET/POST /api/cron/cleanup-reservations`

**Purpose:** Releases expired inventory reservations to prevent stock from being held indefinitely.

**Configuration:**
- Reservation timeout: 15 minutes (default)
- Scheduling: Run every 5 minutes

**Process:**
1. Finds active reservations where:
   - `status = 'active'`
   - `expiresAt < now()`
2. Updates each to:
   - `status = 'expired'`
   - `releasedAt = now()`
3. Stock becomes available again for new orders

**Response:**
```json
{
  "success": true,
  "cleanedCount": 12,
  "timestamp": "2024-11-24T08:42:00.000Z"
}
```

**Implementation:**
- Service: `src/services/InventoryService.ts` - `cleanupExpiredReservations()`
- Route: `app/api/cron/cleanup-reservations/route.ts`
- Model: `InventoryReservation` in `prisma/schema.prisma`

## Setup

### 1. Environment Variables

Add to your `.env` file:
```bash
# Required for all cron jobs
CRON_SECRET="your-strong-random-secret"

# Required for email worker
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="noreply@yourdomain.com"

# Required for webhook worker
PAYMENT_WEBHOOK_SECRET="your-webhook-secret"
```

### 2. Deployment Options

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json` in the project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "*/2 * * * *"
    },
    {
      "path": "/api/cron/retry-webhooks",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/cleanup-reservations",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Vercel automatically adds the `CRON_SECRET` header to requests.

#### Option B: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [AWS EventBridge](https://aws.amazon.com/eventbridge/)
- GitHub Actions (see Option C)

Configure each job with:
- URL: `https://yourdomain.com/api/cron/{worker-name}`
- Method: GET or POST
- Header: `Authorization: Bearer {CRON_SECRET}`
- Schedule: See recommended schedules above

#### Option C: GitHub Actions

Create `.github/workflows/cron-jobs.yml`:
```yaml
name: Background Workers

on:
  schedule:
    # Email queue - every 2 minutes
    - cron: '*/2 * * * *'
    # Webhook retry - every 10 minutes
    - cron: '*/10 * * * *'
    # Inventory cleanup - every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  email-queue:
    if: github.event.schedule == '*/2 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/process-email-queue

  webhook-retry:
    if: github.event.schedule == '*/10 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Retry Failed Webhooks
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/retry-webhooks

  inventory-cleanup:
    if: github.event.schedule == '*/5 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Inventory Reservations
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/cleanup-reservations
```

Add `CRON_SECRET` to your GitHub repository secrets.

#### Option D: Self-Hosted Cron

On your server, add to crontab:
```bash
# Email queue - every 2 minutes
*/2 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/process-email-queue

# Webhook retry - every 10 minutes
*/10 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/retry-webhooks

# Inventory cleanup - every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/cleanup-reservations
```

## Monitoring

### Health Checks

Call each endpoint manually to verify it's working:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/process-email-queue

curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/retry-webhooks

curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/cleanup-reservations
```

### Database Queries

Check email queue status:
```sql
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;
```

Check webhook retry status:
```sql
SELECT status, COUNT(*) as count, AVG(retry_count) as avg_retries
FROM webhook_events
WHERE archived = false
GROUP BY status;
```

Check expired reservations:
```sql
SELECT COUNT(*) as expired_count
FROM inventory_reservations
WHERE status = 'active' AND expires_at < NOW();
```

### Logging

All workers log events using the application logger:
- `email_queue_cron_completed` - Email processing completed
- `webhook_retry_cron_completed` - Webhook retry completed
- `email_queued` - Email added to queue
- `queued_email_sent` - Email sent successfully
- `webhook_retry_succeeded` - Webhook retry succeeded
- `webhook_retry_failed` - Webhook retry failed
- `webhook_retry_limit_reached` - Webhook archived after max retries

Check application logs for these events to monitor worker health.

## Troubleshooting

### Email Queue Issues

**Problem:** Emails not being sent

**Solutions:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for API errors
3. Query failed emails: `SELECT * FROM email_queue WHERE status = 'failed'`
4. Check `last_error` field for error details

**Problem:** Emails stuck in pending

**Solutions:**
1. Verify cron job is running
2. Check `scheduled_for` is not in the future
3. Verify `attempts < max_attempts`

### Webhook Retry Issues

**Problem:** Webhooks not being retried

**Solutions:**
1. Verify `CRON_SECRET` is set correctly
2. Check `next_retry_at` field - might be in the future
3. Verify `retry_count < 5`
4. Check if webhook is archived: `archived = true`

**Problem:** Webhooks failing repeatedly

**Solutions:**
1. Check `error_message` field for details
2. Verify webhook payload is valid
3. Check if order still exists
4. For payment issues, may require manual resolution

### Inventory Cleanup Issues

**Problem:** Reservations not being cleaned up

**Solutions:**
1. Verify cron job is running
2. Check system time is synchronized
3. Query expired reservations: 
   ```sql
   SELECT * FROM inventory_reservations 
   WHERE status = 'active' AND expires_at < NOW()
   ```

## Advanced Configuration

### Adjusting Batch Sizes

Edit the worker route files to change batch sizes:

**Email Queue:**
```typescript
// app/api/cron/process-email-queue/route.ts
const result = await processEmailQueue(50); // Default: 20
```

**Webhook Retry:**
```typescript
// app/api/cron/retry-webhooks/route.ts
const result = await retryFailedWebhooks(20); // Default: 10
```

### Custom Retry Logic

Modify `src/services/WebhookService.ts` to customize:
- `MAX_RETRY_ATTEMPTS` - Maximum number of retries (default: 5)
- `INITIAL_RETRY_DELAY_MINUTES` - First retry delay (default: 1 minute)
- `MAX_RETRY_DELAY_MINUTES` - Maximum retry delay (default: 60 minutes)

### Reservation Timeout

Modify `src/services/InventoryService.ts`:
```typescript
export const RESERVATION_TIMEOUT_MINUTES = 15; // Default: 15 minutes
```

## Migration to Inngest (Optional)

For more advanced use cases, consider migrating to [Inngest](https://www.inngest.com/):

**Benefits:**
- Built-in retry logic
- Better observability
- Fan-out patterns
- Priority queues
- Automatic error handling

**Migration Steps:**
1. Install Inngest: `npm install inngest`
2. Create Inngest functions from worker logic
3. Update cron endpoints to trigger Inngest
4. Deploy Inngest app

See Inngest documentation for details: https://www.inngest.com/docs

## Related Documentation

- [Email Service Documentation](../src/lib/email.ts)
- [Webhook Processing](../app/api/payments/webhook/route.ts)
- [Inventory Management](../src/services/InventoryService.ts)
- [Prisma Schema](../prisma/schema.prisma)
