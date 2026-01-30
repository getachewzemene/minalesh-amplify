# System Health Monitoring Setup Guide

This guide explains how to set up and use the comprehensive system health monitoring features in the Minalesh Marketplace application.

## Overview

The monitoring system includes:

- ✅ **Uptime Monitoring** - Public health check endpoints for services like UptimeRobot and Pingdom
- ✅ **System Metrics** - Memory, disk, database, and queue monitoring
- ✅ **APM Integration** - Support for New Relic, Datadog, and Sentry
- ✅ **Alert System** - Configurable alerts with email, Slack, and webhook notifications
- ✅ **Public Status Page** - Customer-facing status API
- ✅ **Automated Collection** - Cron jobs for continuous monitoring
- ✅ **Response Time Tracking** - API performance monitoring

## Quick Start

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Required for all monitoring
ADMIN_EMAILS=admin@example.com,ops@example.com

# Optional: APM Integration
NEW_RELIC_LICENSE_KEY=your-newrelic-license-key
NEW_RELIC_APP_NAME=minalesh-marketplace

# OR use Datadog
DATADOG_API_KEY=your-datadog-api-key
DD_SERVICE=minalesh-marketplace
DD_ENV=production

# Optional: Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Sentry (already configured)
SENTRY_DSN=https://...@sentry.io/...
```

### 2. Set Up Uptime Monitoring

#### Option A: UptimeRobot
1. Sign up at https://uptimerobot.com
2. Create a new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
3. Configure alerts to your email/Slack

#### Option B: Pingdom
1. Sign up at https://pingdom.com
2. Add an Uptime Check:
   - URL: `https://your-domain.com/api/health`
   - Check interval: 1-5 minutes
3. Set up alert contacts

### 3. Configure Alert Rules

Create alert configurations via the admin API:

```bash
curl -X POST https://your-domain.com/api/admin/monitoring/alerts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "name": "High Memory Usage",
    "metricType": "memory_heap_used_mb",
    "condition": "gt",
    "threshold": 512,
    "severity": "warning",
    "notifyEmail": true,
    "notifySlack": true
  }'
```

### 4. Verify Automatic Metric Collection

The system automatically collects metrics every 5 minutes via Vercel Cron. To test manually:

```bash
curl -X POST https://your-domain.com/api/cron/collect-metrics \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## API Endpoints

### Public Endpoints

#### Health Check
```bash
# Simple health check
GET /api/health

# Detailed health check (includes memory, CPU, etc.)
GET /api/health?detailed=true

# Lightweight check (HEAD request)
HEAD /api/health
```

#### Status Page
```bash
# Get public system status
GET /api/status
```

### Admin Endpoints

#### System Health Overview
```bash
GET /api/admin/monitoring/health
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Get Metrics
```bash
GET /api/admin/monitoring/health?action=metrics&metricType=memory_heap_used_mb&hours=24
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Get Metric Summary
```bash
GET /api/admin/monitoring/health?action=summary&hours=24
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Alert Management
```bash
# List all alert configurations
GET /api/admin/monitoring/alerts?action=configs
Authorization: Bearer YOUR_ADMIN_TOKEN

# Get alert history
GET /api/admin/monitoring/alerts?action=history&days=7
Authorization: Bearer YOUR_ADMIN_TOKEN

# Acknowledge an alert
POST /api/admin/monitoring/alerts
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "action": "acknowledge",
  "alertId": "alert-uuid"
}

# Resolve an alert
POST /api/admin/monitoring/alerts
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "action": "resolve",
  "alertId": "alert-uuid"
}
```

## Metrics Collected

The system automatically collects these metrics every 5 minutes:

### Memory Metrics
- `memory_heap_used_mb` - Node.js heap memory used (MB)
- `memory_heap_total_mb` - Node.js heap memory total (MB)
- `memory_rss_mb` - Resident Set Size (MB)
- `system_memory_used_percent` - System-wide memory usage (%)

### Disk Metrics
- `disk_usage_percent` - Root filesystem disk usage (%)

### Database Metrics
- `db_latency_ms` - Database query latency (ms)
- `db_active_connections` - Number of active database connections

### Queue Metrics
- `email_queue_depth` - Pending emails in queue
- `email_queue_failed_24h` - Failed emails in last 24 hours
- `webhook_queue_depth` - Pending webhooks

### Application Metrics
- `error_rate_percent` - Error rate based on webhook failures (%)
- `api_response_time_ms` - Slow API response times (>1000ms)

## Alert Conditions

When creating alerts, use these conditions:

- `gt` - Greater than (value > threshold)
- `lt` - Less than (value < threshold)
- `eq` - Equal to (value == threshold)
- `gte` - Greater than or equal (value >= threshold)
- `lte` - Less than or equal (value <= threshold)

### Severity Levels

- `info` - Informational alerts
- `warning` - Warning alerts (yellow)
- `critical` - Critical alerts (red)

## Notification Channels

### Email Notifications
Alerts are sent to all emails in `ADMIN_EMAILS` environment variable.

### Slack Notifications
Configure `SLACK_WEBHOOK_URL` to receive alerts in Slack:

1. Go to https://api.slack.com/messaging/webhooks
2. Create an Incoming Webhook
3. Copy the webhook URL to your `.env` file

### Webhook Notifications
Set `webhookUrl` when creating an alert configuration to receive JSON payloads:

```json
{
  "type": "alert",
  "severity": "warning",
  "message": "Alert: High Memory Usage - memory_heap_used_mb is 600 (threshold: 512)",
  "metricValue": 600,
  "threshold": 512,
  "timestamp": "2024-01-21T16:00:00.000Z"
}
```

## APM Integration

### New Relic

1. Sign up at https://newrelic.com
2. Get your license key
3. Add to `.env`:
   ```bash
   NEW_RELIC_LICENSE_KEY=your-license-key
   NEW_RELIC_APP_NAME=minalesh-marketplace
   ```
4. Metrics are automatically sent to New Relic

### Datadog

1. Sign up at https://www.datadoghq.com
2. Get your API key
3. Add to `.env`:
   ```bash
   DATADOG_API_KEY=your-api-key
   DD_SERVICE=minalesh-marketplace
   DD_ENV=production
   ```
4. Metrics are automatically sent to Datadog

## Response Time Tracking

Track API response times by wrapping your route handlers:

```typescript
import { withResponseTimeTracking } from '@/lib/api-middleware';

export async function GET(req: NextRequest) {
  return withResponseTimeTracking(req, async () => {
    // Your handler code here
    return NextResponse.json({ data: ... });
  });
}
```

## Troubleshooting

### No Metrics Being Collected

1. Check that the cron job is configured in `vercel.json`
2. Verify `CRON_SECRET` is set
3. Check Vercel cron logs in dashboard
4. Manually trigger: `POST /api/cron/collect-metrics`

### Alerts Not Sending

1. Verify `ADMIN_EMAILS` is set
2. Check `RESEND_API_KEY` is configured
3. For Slack: verify `SLACK_WEBHOOK_URL` is valid
4. Check alert configuration has `notifyEmail: true` or `notifySlack: true`

### Database Metrics Missing

1. Ensure database connection is working
2. Check that the database user has permissions for `pg_stat_activity`
3. Verify PostgreSQL version >= 9.4

## Best Practices

1. **Alert Thresholds**: Start conservative and adjust based on actual usage
2. **Alert Cooldown**: Use 15-30 minute cooldowns to avoid alert fatigue
3. **Multiple Channels**: Configure both email and Slack for critical alerts
4. **Regular Review**: Review alert history weekly to tune thresholds
5. **Status Page**: Share `/api/status` URL with customers for transparency

## Security Considerations

- Health check endpoints are public (needed for uptime monitoring)
- Admin endpoints require authentication
- Cron endpoints require `CRON_SECRET`
- Never expose detailed health info (`?detailed=true`) in production without auth
- Monitor for unusual patterns in metrics

## Next Steps

1. Set up uptime monitoring service
2. Configure at least one alert for critical metrics
3. Test notifications work correctly
4. Share status page with support team
5. Monitor for a week and adjust thresholds as needed

## Support

For issues or questions:
- Check logs in Vercel dashboard
- Review alert history via `/api/admin/monitoring/alerts`
- Contact: support@yourdomain.com
