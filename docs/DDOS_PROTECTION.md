# DDoS Protection & Rate Limiting

This document describes the comprehensive DDoS protection and rate limiting system implemented in the Minalesh marketplace application.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Cloudflare Integration](#cloudflare-integration)
- [Database Schema](#database-schema)

## Overview

The DDoS protection system provides multiple layers of security to protect the application from abuse and malicious traffic:

1. **Rate Limiting**: IP-based request throttling with configurable limits
2. **IP Whitelist/Blacklist**: Manual and automatic IP management
3. **Bot Detection**: User-Agent analysis and pattern detection
4. **Security Events**: Comprehensive logging and monitoring
5. **Cloudflare Integration**: Leverages Cloudflare's security features
6. **Distributed Rate Limiting**: Redis-based rate limiting for multi-server deployments

## Features

### 1. Rate Limiting

- **Redis-Based**: Distributed rate limiting using Redis sorted sets for sliding window
- **Fallback Support**: Automatically falls back to in-memory rate limiting if Redis is unavailable
- **Configurable Tiers**: Different rate limits for different endpoint types
- **Header Information**: Standard rate limit headers (`X-RateLimit-*`)

### 2. IP Management

#### Whitelist
- **Bypass Rate Limits**: Whitelisted IPs bypass rate limiting
- **Expiration Support**: Optional expiration dates for temporary whitelist
- **Admin Management**: Full CRUD operations via admin API

#### Blacklist
- **Automatic Blacklisting**: Critical security events trigger auto-blacklist
- **Severity Levels**: low, medium, high, critical
- **Temporary Bans**: Support for time-limited blacklist entries
- **Block Tracking**: Counts how many requests were blocked per IP

### 3. Bot Detection

Detects suspicious user agents including:
- Generic HTTP clients (curl, wget, python-requests)
- Scrapers and crawlers
- Headless browsers
- Automated tools

Allows legitimate bots:
- Search engine crawlers (Google, Bing, etc.)
- Monitoring services (UptimeRobot, Pingdom)
- Analytics services

### 4. Security Events

Comprehensive logging of security-related events:
- Rate limit exceeded
- Blacklist blocks
- Suspicious user agents
- Suspicious request patterns
- Cloudflare threat detection
- Auto-blacklist triggers

### 5. Cloudflare Integration

Detects and utilizes Cloudflare headers:
- `CF-Connecting-IP`: Real client IP
- `CF-IPCountry`: Client country
- `CF-Threat-Score`: Cloudflare threat assessment
- `CF-Ray`: Request identifier

## Architecture

### Components

```
┌─────────────────┐
│   API Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Rate Limit Middleware  │
│  (withRateLimit)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Security Check         │
│  - Cloudflare threats   │
│  - IP whitelist         │
│  - IP blacklist         │
│  - User-Agent analysis  │
│  - Request patterns     │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Allowed │ Blocked
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│Handler │ │ 403/429 Error│
└────────┘ └──────────────┘
```

### Storage

- **Redis**: Primary storage for rate limits and request patterns (sliding window)
- **PostgreSQL**: Persistent storage for IP lists and security events
- **In-Memory**: Fallback rate limit storage when Redis unavailable

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379
REDIS_TLS_ENABLED=false
```

### Rate Limit Configurations

Defined in `src/lib/rate-limit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,             // 5 requests per window
  },
  productList: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 60,            // 60 requests per minute
  },
  default: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100,           // 100 requests per minute
  },
};
```

## API Endpoints

### IP Whitelist Management

#### Add to Whitelist
```http
POST /api/admin/security/whitelist
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "ipAddress": "192.168.1.1",
  "reason": "Corporate office IP",
  "expiresAt": "2024-12-31T23:59:59Z"  // Optional
}
```

#### Remove from Whitelist
```http
DELETE /api/admin/security/whitelist
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "ipAddress": "192.168.1.1"
}
```

#### List Whitelisted IPs
```http
GET /api/admin/security/whitelist?page=1&limit=50
Authorization: Bearer <admin-token>
```

### IP Blacklist Management

#### Add to Blacklist
```http
POST /api/admin/security/blacklist
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "ipAddress": "10.0.0.1",
  "reason": "Repeated abuse attempts",
  "severity": "high",                    // low, medium, high, critical
  "expiresAt": "2024-01-21T23:59:59Z"   // Optional
}
```

#### Remove from Blacklist
```http
DELETE /api/admin/security/blacklist
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "ipAddress": "10.0.0.1"
}
```

#### List Blacklisted IPs
```http
GET /api/admin/security/blacklist?page=1&limit=50&severity=high
Authorization: Bearer <admin-token>
```

### Security Events

#### List Security Events
```http
GET /api/admin/security/events?page=1&limit=50&severity=high&resolved=false
Authorization: Bearer <admin-token>
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `eventType`: Filter by event type
- `severity`: Filter by severity (low, medium, high, critical)
- `resolved`: Filter by resolution status (true/false)
- `ipAddress`: Filter by specific IP

Response includes summary statistics:
```json
{
  "items": [...],
  "stats": {
    "low": 10,
    "medium": 5,
    "high": 2,
    "critical": 1
  },
  "pagination": {...}
}
```

## Usage Examples

### Applying Rate Limiting to API Route

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { withApiLogger } from '@/lib/api-logger';

async function handler(request: Request): Promise<NextResponse> {
  // Your handler logic
  return NextResponse.json({ data: 'success' });
}

// Apply rate limiting
export const POST = withApiLogger(
  withRateLimit(handler, RATE_LIMIT_CONFIGS.auth)
);
```

### Custom Rate Limit Configuration

```typescript
export const GET = withApiLogger(
  withRateLimit(handler, {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute
    skipWhitelist: false,     // Check whitelist (default)
    skipSecurityCheck: false  // Perform security checks (default)
  })
);
```

### Manual IP Management

```typescript
import {
  addIpToWhitelist,
  addIpToBlacklist,
  isIpWhitelisted,
  isIpBlacklisted
} from '@/lib/security';

// Whitelist an IP
await addIpToWhitelist(
  '192.168.1.1',
  'Trusted partner',
  adminUserId,
  new Date('2024-12-31') // Optional expiration
);

// Blacklist an IP
await addIpToBlacklist(
  '10.0.0.1',
  'Automated scraping detected',
  'high',
  adminUserId,
  new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour ban
);

// Check IP status
const isWhitelisted = await isIpWhitelisted('192.168.1.1');
const blacklistInfo = await isIpBlacklisted('10.0.0.1');
```

### Security Event Logging

```typescript
import { logSecurityEvent } from '@/lib/security';

await logSecurityEvent(
  clientIp,
  'suspicious_pattern',
  'medium',
  request.headers.get('user-agent'),
  '/api/products',
  { 
    pattern: 'rapid_sequential_access',
    requestCount: 100 
  }
);
```

## Cloudflare Integration

### Setup

1. **Enable Cloudflare for your domain**
2. **Configure Security Settings**:
   - Enable "Bot Fight Mode"
   - Enable "Challenge Passage"
   - Set "Security Level" to Medium or High
3. **IP Geolocation**: Automatically enabled
4. **Threat Score**: Automatically calculated

### Headers Forwarded

When behind Cloudflare, the following headers are automatically detected:

- `CF-Connecting-IP`: Real client IP (used instead of X-Forwarded-For)
- `CF-IPCountry`: Two-letter country code
- `CF-Ray`: Unique request identifier
- `CF-Visitor`: Protocol information
- `CF-Threat-Score`: 0-100 (higher = more suspicious)

### Automatic Threat Blocking

Requests with `CF-Threat-Score > 50` are automatically flagged and may require CAPTCHA verification.

### Example Cloudflare Configuration

In Cloudflare Dashboard > Security:

```yaml
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: On
Privacy Pass Support: On
```

## Database Schema

### IpWhitelist

```prisma
model IpWhitelist {
  id          String   @id @default(uuid())
  ipAddress   String   @unique
  reason      String
  createdBy   String?  @db.Uuid
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
}
```

### IpBlacklist

```prisma
model IpBlacklist {
  id            String    @id @default(uuid())
  ipAddress     String    @unique
  reason        String
  severity      String    @default("medium")
  createdBy     String?   @db.Uuid
  createdAt     DateTime  @default(now())
  expiresAt     DateTime?
  isActive      Boolean   @default(true)
  blockCount    Int       @default(0)
  lastBlockedAt DateTime?
}
```

### SecurityEvent

```prisma
model SecurityEvent {
  id         String    @id @default(uuid())
  ipAddress  String
  eventType  String
  severity   String    @default("low")
  userAgent  String?
  endpoint   String?
  metadata   Json?
  createdAt  DateTime  @default(now())
  resolved   Boolean   @default(false)
  resolvedAt DateTime?
  resolvedBy String?   @db.Uuid
}
```

## Migration

Run the migration to create the security tables:

```bash
npx prisma migrate dev --name add_security_tables
```

## Monitoring

### Key Metrics to Monitor

1. **Rate Limit Hits**: Track 429 responses
2. **Blacklist Blocks**: Monitor blocked request count
3. **Security Events**: Watch for spikes in high/critical events
4. **Bot Detection**: Track suspicious user agent patterns
5. **Cloudflare Threats**: Monitor CF-Threat-Score > 50

### Recommended Alerts

- Alert on > 100 rate limit violations per minute
- Alert on > 10 critical security events per hour
- Alert on auto-blacklist triggers
- Alert on Cloudflare threat score spikes

## Best Practices

1. **Regular Review**: Review security events weekly
2. **Whitelist Management**: Keep whitelist lean and updated
3. **Temporary Bans**: Use expiration for first-time offenders
4. **Redis Monitoring**: Monitor Redis performance and memory
5. **Log Retention**: Archive old security events after 90 days
6. **False Positives**: Investigate and adjust bot detection patterns
7. **Rate Limit Tuning**: Adjust limits based on legitimate traffic patterns

## Troubleshooting

### Redis Connection Issues

If Redis is unavailable, the system automatically falls back to in-memory rate limiting. Check logs for:
```
Redis rate limit error, falling back to memory
```

### False Positives

If legitimate users are being blocked:
1. Check security events for their IP
2. Review user agent patterns
3. Add to whitelist if appropriate
4. Adjust bot detection patterns if needed

### High Rate Limit Violations

If seeing many 429 errors from legitimate users:
1. Review current rate limit configurations
2. Consider increasing limits for specific endpoints
3. Check for retry loops in client code
4. Verify clients are respecting Retry-After header

## Future Enhancements

- CAPTCHA integration (hCaptcha/reCAPTCHA) ✅ IMPLEMENTED
- Machine learning-based bot detection
- Geographic rate limiting
- API key-based rate limiting
- WebSocket connection limits
- GraphQL query complexity analysis

## CAPTCHA Integration (NEW)

### Setup hCaptcha

1. **Sign up for hCaptcha**: Visit https://www.hcaptcha.com/
2. **Get credentials**: Create a new site and obtain site key and secret key
3. **Add to environment**:
```bash
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key
```

### Using CAPTCHA in React Components

```tsx
import { HCaptcha, useCaptcha } from '@/components/security/HCaptcha';

function LoginForm() {
  const { 
    token, 
    error, 
    isExpired, 
    handleVerify, 
    handleError, 
    handleExpire 
  } = useCaptcha();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Include CAPTCHA token in request
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Captcha-Token': token || '', // Include CAPTCHA token
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {/* CAPTCHA widget */}
      <HCaptcha
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        theme="light"
        size="normal"
      />
      
      {error && <p className="text-red-500">CAPTCHA error: {error.message}</p>}
      
      <button disabled={!token || isExpired}>Submit</button>
    </form>
  );
}
```

### Server-Side CAPTCHA Verification

The rate limiting middleware automatically handles CAPTCHA verification:

1. **Suspicious activity detected**: Middleware sets `requiresCaptcha: true`
2. **Client makes request**: Must include `X-Captcha-Token` header
3. **Server verifies**: Uses `verifyCaptcha()` to validate token
4. **Success/Failure**: Returns appropriate response

### Manual CAPTCHA Verification

```typescript
import { verifyCaptcha } from '@/lib/captcha';

async function handler(request: Request) {
  const captchaToken = request.headers.get('x-captcha-token');
  
  if (captchaToken) {
    const result = await verifyCaptcha(captchaToken);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }
  }
  
  // Proceed with request handling
}
```

### CAPTCHA Flow

1. **Normal Request**: No CAPTCHA required
2. **Suspicious Pattern Detected**: 
   - Server returns `403` with `X-Captcha-Required: true`
   - Client displays CAPTCHA widget
3. **User Completes CAPTCHA**:
   - Client retries request with `X-Captcha-Token` header
   - Server verifies token and processes request
4. **Verification Success**: Request proceeds normally
5. **Verification Failed**: Returns error with reason

### Testing CAPTCHA

For development/testing without CAPTCHA configured:
- Middleware allows requests without CAPTCHA if not configured
- Set `HCAPTCHA_SECRET_KEY` to enable strict verification
- Use hCaptcha test keys for integration testing:
  - Site key: `10000000-ffff-ffff-ffff-000000000001`
  - Secret key: `0x0000000000000000000000000000000000000000`
