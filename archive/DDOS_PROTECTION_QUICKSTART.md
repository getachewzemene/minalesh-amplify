# DDoS Protection Quick Start Guide

This guide will help you quickly set up and configure DDoS protection for the Minalesh marketplace.

## Quick Setup (5 minutes)

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Redis (for distributed rate limiting)
REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false

# hCaptcha (for bot protection)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key
```

### 2. Database Migration

Run the migration to create security tables:

```bash
npx prisma migrate deploy
```

This creates:
- `ip_whitelist`: Trusted IPs
- `ip_blacklist`: Blocked IPs
- `security_events`: Security incident tracking

### 3. Verify Setup

```bash
# Run tests
npm test

# All 970 tests should pass
```

## Basic Usage

### Applying Rate Limiting to API Routes

All you need is to wrap your handler with `withRateLimit`:

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

async function handler(request: Request) {
  // Your API logic
  return NextResponse.json({ success: true });
}

// Apply rate limiting and logging
export const POST = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.default)
);
```

That's it! Your endpoint now has:
- ✅ Rate limiting (100 req/min default)
- ✅ IP whitelist/blacklist checking
- ✅ Bot detection
- ✅ Cloudflare integration
- ✅ Security event logging
- ✅ CAPTCHA for suspicious activity

### Rate Limit Tiers

Choose the right tier for your endpoint:

```typescript
// Auth endpoints (strict)
RATE_LIMIT_CONFIGS.auth        // 5 requests per 15 minutes

// Product listing (moderate)
RATE_LIMIT_CONFIGS.productList  // 60 requests per minute

// General API (permissive)
RATE_LIMIT_CONFIGS.default      // 100 requests per minute

// Custom configuration
{
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 50,        // 50 requests
}
```

## Admin Operations

### View Security Dashboard

Access the admin security endpoints:

```bash
# List security events
GET /api/admin/security/events

# List blacklisted IPs
GET /api/admin/security/blacklist

# List whitelisted IPs
GET /api/admin/security/whitelist
```

### Whitelist an IP

```bash
curl -X POST /api/admin/security/whitelist \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.1",
    "reason": "Office IP",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### Blacklist an IP

```bash
curl -X POST /api/admin/security/blacklist \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "10.0.0.1",
    "reason": "Automated scraping",
    "severity": "high"
  }'
```

## Cloudflare Setup (Optional but Recommended)

### 1. Enable Cloudflare

Point your domain's DNS to Cloudflare.

### 2. Configure Security

In Cloudflare Dashboard > Security:

- **Security Level**: Medium or High
- **Bot Fight Mode**: On
- **Challenge Passage**: 30 minutes
- **Browser Integrity Check**: On

### 3. That's It!

The application automatically detects Cloudflare headers:
- Real client IP from `CF-Connecting-IP`
- Country code from `CF-IPCountry`
- Threat score from `CF-Threat-Score`

## Testing

### Trigger Rate Limit

```bash
# Make 101 requests quickly (exceeds default limit of 100/min)
for i in {1..101}; do
  curl http://localhost:3000/api/products
done

# 101st request should return 429 Too Many Requests
```

### Test Bot Detection

```bash
# Suspicious user agent
curl -H "User-Agent: curl/7.68.0" http://localhost:3000/api/products
# Should require CAPTCHA (403 with X-Captcha-Required header)

# Legitimate browser
curl -H "User-Agent: Mozilla/5.0..." http://localhost:3000/api/products
# Should work normally
```

### Verify Security Events

```bash
# As admin, check security events
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/security/events
```

## Monitoring

### Key Metrics

Monitor these in your logs:

1. **Rate Limit Hits**: `429` status codes
2. **Security Events**: Check event severity
3. **CAPTCHA Failures**: Failed verifications
4. **Blacklist Blocks**: Blocked request count

### Redis Monitoring

```bash
# Connect to Redis
redis-cli

# Check rate limit keys
KEYS ratelimit:*

# Check request pattern keys
KEYS request:pattern:*

# Monitor memory usage
INFO memory
```

## Troubleshooting

### Rate Limiting Not Working

**Check:** Is Redis running?
```bash
redis-cli ping
# Should return: PONG
```

**Fallback:** Without Redis, uses in-memory storage (single server only)

### CAPTCHA Not Showing

**Check:** Environment variables set?
```bash
echo $NEXT_PUBLIC_HCAPTCHA_SITE_KEY
echo $HCAPTCHA_SECRET_KEY
```

**Note:** CAPTCHA is optional. Without configuration, suspicious requests are allowed with a warning.

### Too Many False Positives

**Option 1:** Whitelist your IPs
```typescript
await addIpToWhitelist('192.168.1.1', 'Office network', adminId);
```

**Option 2:** Increase rate limits for specific endpoints
```typescript
export const GET = withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 200, // Increased from 100
});
```

**Option 3:** Adjust bot detection patterns in `src/lib/security.ts`

## Production Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` in environment
- [ ] Configure Redis with persistence
- [ ] Set up hCaptcha with your domain
- [ ] Enable Cloudflare (recommended)
- [ ] Configure monitoring/alerts
- [ ] Review rate limit configurations
- [ ] Test rate limiting under load
- [ ] Set up log aggregation
- [ ] Configure database backups (includes security tables)
- [ ] Review and adjust bot detection patterns
- [ ] Set up admin access for IP management

## Performance Impact

**Redis Rate Limiting:**
- ~1-2ms per request (Redis lookup)
- Scales horizontally
- Minimal memory usage

**Security Checks:**
- ~0.5ms per request (header inspection)
- Database queries cached for 5 minutes
- Negligible CPU impact

**CAPTCHA:**
- Only triggered for suspicious activity
- No impact on normal requests
- ~200ms verification time

## Getting Help

- **Documentation**: `/docs/DDOS_PROTECTION.md`
- **Tests**: See `src/__tests__/security.test.ts` for examples
- **API Reference**: Check route files in `app/api/admin/security/`

## Next Steps

1. Review security events regularly
2. Fine-tune rate limits based on traffic
3. Whitelist known good IPs (offices, partners)
4. Monitor for false positives
5. Set up alerts for critical events
6. Consider ML-based detection (future enhancement)
