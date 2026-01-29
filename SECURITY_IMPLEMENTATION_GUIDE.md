# Security Implementation Guide

## Overview

This document provides a comprehensive guide to the security measures implemented in the Minalesh marketplace to protect against DDoS attacks, CSRF attacks, and other common vulnerabilities.

## Table of Contents

1. [DDoS Protection](#ddos-protection)
2. [CSRF Protection](#csrf-protection)
3. [Rate Limiting](#rate-limiting)
4. [Security Headers](#security-headers)
5. [Best Practices](#best-practices)
6. [Testing](#testing)

## DDoS Protection

### Features

The application implements multi-layered DDoS protection:

#### 1. IP Whitelist/Blacklist System

**Location:** `src/lib/security.ts`

- **IP Whitelisting:** Trusted IPs bypass rate limiting and security checks
- **IP Blacklisting:** Malicious IPs are blocked automatically
- **Redis Caching:** IP lists cached for 5 minutes for performance
- **Auto-blacklisting:** Critical security events trigger automatic IP blocking

**Admin API Endpoints:**
```bash
# Whitelist an IP
POST /api/admin/security/whitelist
{
  "ipAddress": "192.168.1.1",
  "reason": "Office IP",
  "expiresAt": "2024-12-31T23:59:59Z"
}

# Blacklist an IP
POST /api/admin/security/blacklist
{
  "ipAddress": "10.0.0.1",
  "reason": "Automated scraping",
  "severity": "high"
}

# View security events
GET /api/admin/security/events
```

#### 2. Bot Detection

**Suspicious User-Agent Patterns:**
- Crawlers/scrapers (curl, wget, python, etc.)
- Headless browsers (selenium, phantom)
- HTTP libraries (axios, node-fetch, okhttp)

**Allowed Bots:**
- Search engines (Google, Bing, DuckDuckGo)
- Monitoring services (UptimeRobot, Pingdom)

#### 3. Request Pattern Analysis

**Thresholds:**
- 60 requests per minute from single IP
- 30 requests per minute to same endpoint

**Actions:**
- Log security event
- Require CAPTCHA verification
- Temporary block for repeated violations

#### 4. Cloudflare Integration

Automatically detects and uses Cloudflare headers:
- `CF-Connecting-IP`: Real client IP
- `CF-IPCountry`: Client country
- `CF-Threat-Score`: Cloudflare threat assessment

**Cloudflare Setup (Recommended):**
1. Point domain DNS to Cloudflare
2. Enable Security Level: Medium or High
3. Enable Bot Fight Mode
4. Set Challenge Passage: 30 minutes

## CSRF Protection

### Overview

**Location:** `src/lib/csrf.ts`

Cross-Site Request Forgery (CSRF) protection using the **Double Submit Cookie** pattern with optional Redis verification.

### How It Works

1. Client requests CSRF token:
   ```bash
   GET /api/auth/csrf-token
   ```

2. Server generates token and:
   - Returns token in response body
   - Sets `csrf_token` cookie (HttpOnly: false, SameSite: strict)
   - Stores token in Redis for verification (1 hour TTL)

3. Client includes token in mutation requests:
   ```bash
   POST /api/orders
   Headers:
     X-CSRF-Token: <token-from-response>
     Cookie: csrf_token=<token-from-cookie>
   ```

4. Server validates:
   - Header token matches cookie token
   - Token exists in Redis (if available)
   - Tokens match using constant-time comparison

### Implementation

#### Protect Individual Routes

```typescript
import { withCsrfProtection } from '@/lib/csrf';

async function handler(request: Request) {
  // Your API logic
  return NextResponse.json({ success: true });
}

export const POST = withCsrfProtection(handler);
```

#### Use Security Middleware

```typescript
import { withSecurity } from '@/lib/security-middleware';

// Default security (CSRF + Rate Limiting + Logging)
export const POST = withSecurity(handler);

// Custom configuration
export const POST = withSecurity(handler, {
  csrf: { enabled: true, skipForAuthHeader: false },
  rateLimit: RATE_LIMIT_CONFIGS.auth,
});
```

#### Skip CSRF for API Clients

For API-only endpoints accessed with Bearer tokens:

```typescript
export const POST = withSecurity(handler, {
  csrf: { enabled: true, skipForAuthHeader: true },
});
```

### Security Presets

**Auth Routes:**
```typescript
import { withAuthSecurity } from '@/lib/security-middleware';

export const POST = withAuthSecurity(handler);
// - Strict rate limiting (5 req/15min)
// - CSRF enabled (no Bearer skip)
// - API logging enabled
```

**Payment Routes:**
```typescript
import { withPaymentSecurity } from '@/lib/security-middleware';

export const POST = withPaymentSecurity(handler);
// - Strict rate limiting (5 req/15min)
// - CSRF enabled (no Bearer skip)
// - API logging enabled
```

**Admin Routes:**
```typescript
import { withAdminSecurity } from '@/lib/security-middleware';

export const POST = withAdminSecurity(handler);
// - Default rate limiting (100 req/min)
// - CSRF enabled (Bearer skip allowed)
// - API logging enabled
```

## Rate Limiting

### Overview

**Location:** `src/lib/rate-limit.ts`

IP-based rate limiting using sliding window algorithm with Redis (+ in-memory fallback).

### Implementation

#### Built-in Configurations

```typescript
RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,            // 5 requests
  },
  productList: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 60,           // 60 requests
  },
  default: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,          // 100 requests
  },
}
```

#### Apply to Routes

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// Use preset
export const POST = withRateLimit(handler, RATE_LIMIT_CONFIGS.auth);

// Custom limits
export const POST = withRateLimit(handler, {
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 10,        // 10 requests
});
```

#### Current Coverage

**Protected Routes (as of this implementation):**

| Route | Method | Limit | Window |
|-------|--------|-------|--------|
| /api/auth/login | POST | 5 | 15 min |
| /api/auth/register | POST | 5 | 15 min |
| /api/auth/register-vendor | POST | 5 | 15 min |
| /api/payments/create-intent | POST | 5 | 1 min |
| /api/orders | POST | 10 | 1 min |
| /api/orders | GET | 100 | 1 min |
| /api/cart/* | ALL | 100 | 1 min |
| /api/reviews | GET | 60 | 1 min |
| /api/reviews | POST | 5 | 1 hour |
| /api/refunds | GET | 100 | 1 min |
| /api/refunds | POST | 3 | 1 hour |
| /api/upload | POST | 20 | 1 hour |
| /api/products/* | GET | 60 | 1 min |

### Response Headers

Rate-limited responses include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

Rate limit exceeded (429):

```
Retry-After: 45
X-RateLimit-Remaining: 0
```

## Security Headers

**Location:** `middleware.ts`

### Headers Applied to All Responses

```typescript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com;
  style-src 'self' 'unsafe-inline' https://hcaptcha.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://hcaptcha.com;
  frame-src 'self' https://hcaptcha.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests

Strict-Transport-Security:
  max-age=63072000; includeSubDomains; preload
  (Production only)

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
```

### CSP Customization

To allow additional sources, edit `middleware.ts`:

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://your-cdn.com",
  // ... other directives
];
```

## Best Practices

### 1. For API Routes

```typescript
// Always use security middleware
import { withSecurity } from '@/lib/security-middleware';

// Choose appropriate rate limit
export const POST = withSecurity(handler, {
  rateLimit: RATE_LIMIT_CONFIGS.auth, // For sensitive endpoints
});
```

### 2. For Frontend

```typescript
// Always fetch CSRF token before mutations
const { csrfToken } = await fetch('/api/auth/csrf-token').then(r => r.json());

// Include in mutation requests
await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData),
});
```

### 3. For Admin Operations

```typescript
// Whitelist office/trusted IPs
await addIpToWhitelist('192.168.1.1', 'Main office', adminId);

// Monitor security events
const events = await prisma.securityEvent.findMany({
  where: {
    severity: { in: ['high', 'critical'] },
    createdAt: { gte: new Date(Date.now() - 86400000) }, // Last 24h
  },
});
```

### 4. For Production

- Set strong `JWT_SECRET` environment variable
- Configure Redis with persistence
- Set up hCaptcha with your domain
- Enable Cloudflare for additional DDoS protection
- Monitor rate limit violations
- Review security events regularly
- Set up alerts for critical events

## Testing

### Test Rate Limiting

```bash
# Trigger rate limit
for i in {1..101}; do
  curl http://localhost:3000/api/products
done

# 101st request should return 429
```

### Test CSRF Protection

```bash
# Should fail without CSRF token
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": []}'

# Should succeed with CSRF token
TOKEN=$(curl http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": []}'
```

### Test Bot Detection

```bash
# Should require CAPTCHA
curl -H "User-Agent: curl/7.68.0" http://localhost:3000/api/products

# Should work normally
curl -H "User-Agent: Mozilla/5.0 ..." http://localhost:3000/api/products
```

### Verify Security Events

```bash
# Check security events (as admin)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/security/events
```

## Monitoring

### Key Metrics to Monitor

1. **Rate Limit Hits** - 429 status codes
2. **Security Events** - Check event severity distribution
3. **CAPTCHA Failures** - Failed verification attempts
4. **Blacklist Blocks** - Blocked request count

### Redis Monitoring

```bash
# Connect to Redis
redis-cli

# Check rate limit keys
KEYS ratelimit:*

# Check CSRF tokens
KEYS csrf:*

# Monitor memory usage
INFO memory
```

## Troubleshooting

### Rate Limiting Not Working

**Problem:** Requests not being rate-limited

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If Redis unavailable, uses in-memory storage (single server only)
```

### CSRF Validation Failing

**Problem:** Valid requests rejected with CSRF error

**Solution:**
1. Ensure cookie is being set: Check browser dev tools
2. Verify token in header: `X-CSRF-Token` header present
3. Check SameSite cookie settings in development
4. For API clients, use Bearer token and `skipForAuthHeader: true`

### Too Many False Positives

**Option 1:** Whitelist IPs
```typescript
await addIpToWhitelist('192.168.1.1', 'Office network', adminId);
```

**Option 2:** Increase rate limits
```typescript
export const GET = withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 200, // Increased from 100
});
```

**Option 3:** Adjust bot detection in `src/lib/security.ts`

## Environment Variables

```bash
# Redis (for distributed rate limiting)
REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false

# hCaptcha (for bot protection)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key

# JWT Secret (critical for security)
JWT_SECRET=strong-random-secret-change-in-production
```

## Next Steps

1. **Expand Coverage:** Apply rate limiting to remaining API routes
2. **Add CORS:** Configure CORS middleware for API access control
3. **Monitoring:** Set up monitoring and alerting for security events
4. **Load Testing:** Test rate limiting under load
5. **Documentation:** Update API documentation with security requirements
6. **Training:** Educate developers on using security middleware
