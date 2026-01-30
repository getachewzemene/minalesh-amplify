# Security Quick Reference

## Quick Start

### Protect an API Route

```typescript
import { withSecurity } from '@/lib/security-middleware';

async function handler(request: Request) {
  // Your API logic
  return NextResponse.json({ success: true });
}

// Apply default security (CSRF + Rate Limiting + Logging)
export const POST = withSecurity(handler);
```

### Get CSRF Token (Frontend)

```typescript
// Fetch token
const { csrfToken } = await fetch('/api/auth/csrf-token').then(r => r.json());

// Use in request
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

## Rate Limit Presets

```typescript
// Authentication routes (5 req/15min)
import { withAuthSecurity } from '@/lib/security-middleware';
export const POST = withAuthSecurity(handler);

// Payment routes (5 req/15min, strict CSRF)
import { withPaymentSecurity } from '@/lib/security-middleware';
export const POST = withPaymentSecurity(handler);

// Admin routes (100 req/min)
import { withAdminSecurity } from '@/lib/security-middleware';
export const POST = withAdminSecurity(handler);

// Public API routes (60 req/min, no CSRF)
import { withPublicApiSecurity } from '@/lib/security-middleware';
export const GET = withPublicApiSecurity(handler);
```

## Custom Configuration

```typescript
import { withSecurity, RATE_LIMIT_CONFIGS } from '@/lib/security-middleware';

export const POST = withSecurity(handler, {
  // Rate limiting
  rateLimit: RATE_LIMIT_CONFIGS.auth, // or custom config
  
  // CSRF protection
  csrf: {
    enabled: true,
    skipForAuthHeader: true, // Skip for Bearer token requests
  },
  
  // Logging
  logging: true,
});

// Custom rate limit
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 50,      // 50 requests
  },
});

// Disable CSRF for API-only endpoint
export const POST = withSecurity(handler, {
  csrf: { enabled: false },
});
```

## Admin Operations

### Whitelist IP

```bash
curl -X POST /api/admin/security/whitelist \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.1",
    "reason": "Office IP",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### Blacklist IP

```bash
curl -X POST /api/admin/security/blacklist \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "10.0.0.1",
    "reason": "Automated scraping",
    "severity": "high"
  }'
```

### View Security Events

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  /api/admin/security/events
```

## Environment Variables

```bash
# Redis (for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# hCaptcha (for bot protection)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key

# JWT Secret
JWT_SECRET=strong-random-secret
```

## Security Headers (Automatic)

All responses include:
- Content-Security-Policy
- Strict-Transport-Security (production)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

## Troubleshooting

### CSRF Token Not Working

1. Check cookie: Browser dev tools → Application → Cookies
2. Verify header: `X-CSRF-Token` present in request
3. For API clients: Use Bearer token + `skipForAuthHeader: true`

### Rate Limit Too Strict

```typescript
// Increase limit
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000,
    maxRequests: 200, // Increased
  },
});

// Or whitelist IP
await addIpToWhitelist('192.168.1.1', 'Trusted source', adminId);
```

### Bot Detected Incorrectly

Whitelist the IP or adjust patterns in `src/lib/security.ts`.

## Response Headers

### Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded (429)

```
Retry-After: 45
X-RateLimit-Remaining: 0
```

### Security Block (403)

```
X-Security-Block: true
X-Captcha-Required: true (if CAPTCHA needed)
```

## Testing

```bash
# Test rate limiting
for i in {1..101}; do curl http://localhost:3000/api/products; done

# Test CSRF
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Test with CSRF token
TOKEN=$(curl http://localhost:3000/api/auth/csrf-token | jq -r '.csrfToken')
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json"
```

## Current Protected Routes

| Route | Method | Limit | Window |
|-------|--------|-------|--------|
| /api/auth/login | POST | 5 | 15 min |
| /api/auth/register | POST | 5 | 15 min |
| /api/payments/create-intent | POST | 5 | 1 min |
| /api/orders | POST | 10 | 1 min |
| /api/cart/* | ALL | 100 | 1 min |
| /api/reviews | POST | 5 | 1 hour |
| /api/refunds | POST | 3 | 1 hour |
| /api/upload | POST | 20 | 1 hour |

For complete documentation, see [SECURITY_IMPLEMENTATION_GUIDE.md](./SECURITY_IMPLEMENTATION_GUIDE.md)
