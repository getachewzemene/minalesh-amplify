# Advanced Security Features Guide

## Overview

This guide covers the advanced security features implemented in the Minalesh marketplace:
1. Admin Security Dashboard
2. Geographic-Based Blocking
3. ML-Based Anomaly Detection

## 1. Admin Security Dashboard

### Access

Navigate to `/admin/security` to access the real-time security monitoring dashboard.

**Requirements:**
- Admin authentication required
- Cookie-based authentication

### Features

#### Real-Time Metrics
- Total security events
- Critical and high severity event counts
- Rate limit violations
- CSRF failures
- Bot detections
- Active blacklist/whitelist counts

#### Event Analytics
- Events grouped by type
- Events grouped by severity
- Time range selection (1h, 24h, 7d, 30d)
- Auto-refresh every 30 seconds

#### Critical Events Table
- Recent high/critical severity events
- IP addresses, event types, endpoints
- Timestamps and resolution status
- Filterable and sortable

#### Blacklist Management
- View active blacklisted IPs
- Block counts and expiration times
- Severity indicators
- Reasons for blocking

### Usage

```typescript
// Dashboard auto-fetches data on load
// Data refreshes automatically every 30 seconds

// Manual refresh
Click "Refresh Now" button

// Change time range
Click time range buttons (1h, 24h, 7d, 30d)

// Disable auto-refresh
Uncheck "Auto-refresh (30s)" checkbox
```

### API Integration

The dashboard uses the monitoring API:

```bash
GET /api/admin/security/monitoring?timeRange=24h
```

Response includes:
- Metrics summary
- Events by type and severity
- Recent critical events
- Blacklisted IPs

## 2. Geographic-Based Blocking

### Overview

Block or allow traffic based on IP geolocation. Supports country and region-level blocking.

### Configuration

#### Environment Variables

```bash
# Block specific countries (ISO codes)
BLOCKED_COUNTRIES=XX,YY,ZZ

# Block specific regions
BLOCKED_REGIONS=Region1,Region2

# Whitelist mode - ONLY allow these countries
ALLOWED_COUNTRIES=US,CA,GB
```

#### Database Configuration

For dynamic configuration, use the site config table:

```typescript
import { updateGeoBlockConfig } from '@/lib/geo-blocking';

await updateGeoBlockConfig({
  blockedCountries: ['XX', 'YY'],
  blockedRegions: ['BadRegion'],
  allowedCountries: ['US', 'CA'], // Optional whitelist
}, 'admin@example.com');
```

### Implementation

#### Check if IP is Blocked

```typescript
import { isGeoBlocked } from '@/lib/geo-blocking';

const result = await isGeoBlocked(ipAddress);

if (result.blocked) {
  // Block the request
  console.log(result.reason);
  console.log(result.location);
}
```

#### Integration in Middleware

```typescript
import { isGeoBlocked, logGeoBlock } from '@/lib/geo-blocking';

export async function middleware(req: NextRequest) {
  const ipAddress = getClientIp(req);
  const geoCheck = await isGeoBlocked(ipAddress);

  if (geoCheck.blocked) {
    await logGeoBlock(
      ipAddress,
      geoCheck.location!,
      geoCheck.reason!,
      req.nextUrl.pathname
    );

    return new NextResponse('Access denied', { status: 403 });
  }

  // Continue processing
}
```

### Features

#### IP Geolocation
- Uses ipapi.co for geolocation (free tier: 1000 requests/day)
- Caches results in Redis (24-hour TTL)
- Automatic fallback if service unavailable

#### Blocking Modes
1. **Blacklist mode**: Block specific countries/regions
2. **Whitelist mode**: Only allow specific countries
3. **Combined mode**: Whitelist with additional regional blocks

#### Logging
- All geo-blocks logged to security events
- Includes country, region, city information
- Triggers high-severity alerts

### Geographic Statistics

Get statistics for the dashboard:

```typescript
import { getGeoStatistics } from '@/lib/geo-blocking';

const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
const stats = await getGeoStatistics(since);

console.log(stats.topCountries);      // Most active countries
console.log(stats.topRegions);        // Most active regions
console.log(stats.blockedByCountry);  // Blocks by country
```

### Best Practices

1. **Test before production**: Test geo-blocking in staging first
2. **Use whitelist cautiously**: Whitelist mode can be restrictive
3. **Monitor false positives**: Check geo-block logs regularly
4. **Cache results**: Geolocation is cached to reduce API calls
5. **Fail open**: If geolocation fails, requests are allowed by default

### Production Considerations

#### Upgrade to Paid Geolocation Service

For production, consider upgrading to a paid service:
- **ipapi.com**: $10-100/month, higher rate limits
- **IP2Location**: One-time purchase, local database
- **MaxMind GeoIP2**: $30/month, high accuracy

Replace the API call in `getGeoLocation()`:

```typescript
// Example: Using MaxMind GeoIP2
import Reader from '@maxmind/geoip2-node';

const reader = await Reader.open('/path/to/GeoLite2-City.mmdb');
const response = reader.city(ipAddress);
```

## 3. ML-Based Anomaly Detection

### Overview

Statistical and machine learning-based anomaly detection identifies suspicious behavior patterns.

### How It Works

#### Behavior Profiling

The system builds behavior profiles for users and IP addresses:
- Average requests per hour
- Common endpoints accessed
- Typical user agents
- Active hours of day
- Active days of week
- Request patterns

#### Anomaly Scoring

Each request is scored (0-100) based on deviations from the profile:
- **Unusual endpoint**: +20 points
- **Unusual user agent**: +25 points
- **Unusual time of day**: +15 points
- **Unusual day of week**: +10 points
- **High activity from new account**: +30 points
- **Request rate spike**: +25 points

**Threshold**: Score > 70 = Anomaly

### Implementation

#### Detect Anomalies

```typescript
import { detectAnomaly, logAnomaly } from '@/lib/anomaly-detection';

const score = await detectAnomaly(
  ipAddress,
  userAgent,
  endpoint,
  userId  // Optional
);

if (score.isAnomaly) {
  console.log('Anomaly detected!');
  console.log('Score:', score.score);
  console.log('Factors:', score.factors);
  console.log('Confidence:', score.confidence);

  // Log the anomaly
  await logAnomaly(ipAddress, score, endpoint, userAgent);

  // Optionally take action
  if (score.score > 85) {
    // High-score anomaly - require CAPTCHA or block
  }
}
```

#### Integration in API Routes

```typescript
import { withSecurity } from '@/lib/security-middleware';
import { detectAnomaly } from '@/lib/anomaly-detection';

async function handler(request: Request) {
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const endpoint = new URL(request.url).pathname;

  // Check for anomalies
  const anomaly = await detectAnomaly(ipAddress, userAgent, endpoint);

  if (anomaly.isAnomaly && anomaly.score > 85) {
    // Require additional verification
    const captchaToken = request.headers.get('x-captcha-token');
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'CAPTCHA required', requiresCaptcha: true },
        { status: 403 }
      );
    }
  }

  // Process request normally
}
```

### Profile Management

#### Calculate Profile

```typescript
import { calculateBehaviorProfile } from '@/lib/anomaly-detection';

// For an IP address
const profile = await calculateBehaviorProfile(ipAddress, 'ip');

// For a user
const profile = await calculateBehaviorProfile(userId, 'user');

console.log('Average requests/hour:', profile.avgRequestsPerHour);
console.log('Common endpoints:', profile.commonEndpoints);
console.log('Typical hours:', profile.typicalHours);
```

#### Update All Profiles (Cron Job)

Create a cron job to update behavior profiles periodically:

```typescript
// app/api/cron/update-behavior-profiles/route.ts
import { updateAllBehaviorProfiles } from '@/lib/anomaly-detection';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await updateAllBehaviorProfiles();

  return Response.json({
    success: true,
    updated: result.updated,
    failed: result.failed,
  });
}
```

Schedule in vercel.json or cron service:

```json
{
  "crons": [{
    "path": "/api/cron/update-behavior-profiles",
    "schedule": "0 2 * * *"  // Daily at 2 AM
  }]
}
```

### Statistics

Get anomaly statistics for the dashboard:

```typescript
import { getAnomalyStatistics } from '@/lib/anomaly-detection';

const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
const stats = await getAnomalyStatistics(since);

console.log('Total anomalies:', stats.totalAnomalies);
console.log('High-score anomalies:', stats.highScoreAnomalies);
console.log('Average score:', stats.avgScore);
console.log('Top factors:', stats.topFactors);
```

### Tuning

#### Adjust Threshold

Modify `ANOMALY_THRESHOLD` in `src/lib/anomaly-detection.ts`:

```typescript
const ANOMALY_THRESHOLD = 70; // Lower = more sensitive
```

#### Adjust Factor Weights

Modify score increments in `detectAnomaly()`:

```typescript
// Make endpoint anomaly more important
if (endpoint && !profile.commonEndpoints.includes(endpoint)) {
  score += 30; // Increased from 20
  factors.push('Accessing unusual endpoint');
}
```

### Future Enhancements

The framework is designed to support more sophisticated ML models:

1. **Integration with ML libraries**:
   ```typescript
   import * as tf from '@tensorflow/tfjs-node';

   async function predictAnomaly(features: number[]): Promise<number> {
     const model = await tf.loadLayersModel('file://./models/anomaly-detection');
     const prediction = model.predict(tf.tensor2d([features]));
     return prediction.dataSync()[0];
   }
   ```

2. **Feature engineering**:
   - Request payload size patterns
   - Header patterns
   - Session duration
   - Click patterns (if tracking)

3. **Model training**:
   - Collect labeled data (known attacks)
   - Train autoencoder or isolation forest
   - Deploy model to serverless function

4. **Real-time learning**:
   - Update profiles after each request
   - Adaptive thresholding

## Monitoring & Alerts

All three features integrate with the security monitoring system:

### Event Types
- `geo_blocked`: Geographic blocking event
- `anomaly_detected`: Anomaly detection event
- `geo_config_updated`: Geo-blocking config changed

### Alerts
- High-severity geo-blocks trigger Slack alerts
- High-score anomalies (>85) trigger Slack alerts
- Configure `SLACK_WEBHOOK_URL` in environment

### Dashboard
- All events visible in admin security dashboard
- Real-time statistics and trends
- Filterable by time range

## Testing

### Test Geographic Blocking

```bash
# Test with VPN from blocked country
curl -H "X-Forwarded-For: <blocked-country-ip>" \
  https://yourapp.com/api/test

# Should return 403 Forbidden
```

### Test Anomaly Detection

```bash
# Generate unusual traffic pattern
for i in {1..100}; do
  curl https://yourapp.com/api/unusual-endpoint
done

# Check security events
curl https://yourapp.com/api/admin/security/monitoring
# Should show anomaly_detected events
```

## Troubleshooting

### Geographic Blocking Not Working

1. Check environment variables are set
2. Verify IP geolocation service is accessible
3. Check Redis cache is working
4. Review security event logs

### Anomaly Detection False Positives

1. Review behavior profiles for accuracy
2. Adjust anomaly threshold
3. Add legitimate patterns to whitelist
4. Increase data collection period (30+ days)

### Dashboard Not Loading

1. Check admin authentication
2. Verify monitoring API is accessible
3. Check browser console for errors
4. Verify Card component is available

## Production Checklist

- [ ] Configure geo-blocking (if needed)
- [ ] Set up paid geolocation service (optional)
- [ ] Schedule behavior profile updates (cron)
- [ ] Configure Slack webhooks for alerts
- [ ] Test admin dashboard access
- [ ] Review and tune anomaly thresholds
- [ ] Monitor false positive rates
- [ ] Set up log aggregation
- [ ] Document incident response procedures

## References

- [SECURITY_IMPLEMENTATION_GUIDE.md](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md)
- [HCAPTCHA_PRODUCTION_SETUP.md](./HCAPTCHA_PRODUCTION_SETUP.md)
