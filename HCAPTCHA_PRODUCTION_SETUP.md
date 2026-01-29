# hCaptcha Production Setup Guide

## Overview

This guide explains how to configure and use hCaptcha for bot protection in production. hCaptcha is integrated with the security system to challenge suspicious requests.

## Prerequisites

1. hCaptcha account (free tier available)
2. Domain registered with hCaptcha
3. Production deployment

## Setup Steps

### 1. Create hCaptcha Account

1. Go to https://www.hcaptcha.com/
2. Sign up for a free account
3. Verify your email

### 2. Add Your Domain

1. Log into hCaptcha dashboard
2. Go to "Sites" → "Add New Site"
3. Enter your production domain (e.g., `minalesh.com`)
4. Add additional domains if needed:
   - `www.minalesh.com`
   - `api.minalesh.com`
5. Select difficulty level (we recommend "Moderate")
6. Save the site

### 3. Get API Keys

After adding your site, you'll receive:
- **Site Key** (public, used in frontend)
- **Secret Key** (private, used in backend)

Copy these keys for the next step.

### 4. Configure Environment Variables

Add to your `.env` file:

```bash
# hCaptcha Configuration
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key-here
HCAPTCHA_SECRET_KEY=your-secret-key-here
```

**Important:**
- Never commit these keys to version control
- Use different keys for development and production
- Store production keys in secure vault (AWS Secrets Manager, etc.)

### 5. Verify Configuration

Test the configuration:

```bash
# Check environment variables are set
echo $NEXT_PUBLIC_HCAPTCHA_SITE_KEY
echo $HCAPTCHA_SECRET_KEY

# Start the application
npm run dev

# Test hCaptcha on a form
```

## Usage

### Frontend Integration

#### Basic Form Usage

```typescript
'use client';

import { useState } from 'react';
import { HCaptcha } from '@/components/security/HCaptcha';
import { api } from '@/lib/api-client';

export function LoginForm() {
  const [captchaToken, setCaptchaToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/api/auth/login', {
        email,
        password,
      }, {
        headers: {
          'X-Captcha-Token': captchaToken,
        },
      });

      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <HCaptcha
        onVerify={(token) => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken('')}
        theme="light"
        size="normal"
      />

      <button type="submit" disabled={!captchaToken}>
        Login
      </button>
    </form>
  );
}
```

#### Conditional CAPTCHA (Show only when required)

```typescript
'use client';

import { useState } from 'react';
import { HCaptcha } from '@/components/security/HCaptcha';
import { api } from '@/lib/api-client';

export function SecureForm() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const headers: any = {};
      if (captchaToken) {
        headers['X-Captcha-Token'] = captchaToken;
      }

      await api.post('/api/sensitive-action', data, { headers });

      // Success
    } catch (error: any) {
      // Check if CAPTCHA required
      if (error.status === 403 && error.data?.requiresCaptcha) {
        setShowCaptcha(true);
        return;
      }

      // Handle other errors
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      {showCaptcha && (
        <div className="my-4">
          <p className="text-sm text-gray-600 mb-2">
            Please complete the security verification
          </p>
          <HCaptcha
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
          />
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Backend Integration

hCaptcha verification is automatically handled by the security middleware when the `X-Captcha-Token` header is present.

#### Manual Verification (if needed)

```typescript
import { verifyCaptcha } from '@/lib/captcha';

export async function POST(request: Request) {
  const captchaToken = request.headers.get('x-captcha-token');

  if (captchaToken) {
    const result = await verifyCaptcha(captchaToken);

    if (!result.success) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed', details: result.error },
        { status: 403 }
      );
    }
  }

  // Continue with request handling
}
```

## Security Triggers

hCaptcha is automatically required when:

1. **Suspicious User-Agent detected:**
   - Bot-like user agents (curl, wget, python, etc.)
   - Headless browsers
   - HTTP libraries

2. **Excessive request patterns:**
   - More than 60 requests per minute from single IP
   - More than 30 requests per minute to same endpoint

3. **Cloudflare threat detected:**
   - High threat score from Cloudflare

4. **IP blacklisted:**
   - IP on blacklist (manual or auto-blacklisted)

## Testing

### Development Testing

In development, you can test hCaptcha with localhost:

1. Add `localhost` to your hCaptcha site domains
2. Use development keys (different from production)
3. Test form submissions

### Production Testing

Before going live:

1. Test on staging environment with production keys
2. Verify CAPTCHA appears when expected
3. Test successful verification
4. Test failed verification
5. Test token expiration

### Testing Checklist

- [ ] CAPTCHA appears on forms
- [ ] CAPTCHA verification succeeds with valid token
- [ ] Form submission fails without CAPTCHA when required
- [ ] CAPTCHA resets after expiration
- [ ] Error messages are user-friendly
- [ ] Mobile experience is acceptable
- [ ] Accessibility is maintained

## Troubleshooting

### CAPTCHA Not Showing

**Problem:** hCaptcha widget doesn't appear

**Solutions:**
1. Check environment variables are set:
   ```bash
   echo $NEXT_PUBLIC_HCAPTCHA_SITE_KEY
   ```

2. Check browser console for errors

3. Verify domain is registered in hCaptcha dashboard

4. Check CSP headers allow hCaptcha domains

### Verification Failing

**Problem:** Valid CAPTCHA tokens are rejected

**Solutions:**
1. Check `HCAPTCHA_SECRET_KEY` is correct

2. Verify token hasn't expired (tokens expire after 2 minutes)

3. Check network connectivity to hCaptcha API

4. Review server logs for specific error messages

### High False Positives

**Problem:** Legitimate users getting CAPTCHA too often

**Solutions:**
1. Adjust bot detection thresholds in `src/lib/security.ts`

2. Whitelist known good IPs

3. Review user-agent patterns

4. Consider increasing rate limits

## Best Practices

### 1. User Experience

- **Show clear instructions:** Tell users why CAPTCHA is required
- **Provide fallback:** Allow users to contact support if stuck
- **Mobile friendly:** Test on mobile devices
- **Accessibility:** Ensure screen reader compatibility

### 2. Security

- **Verify on server:** Never trust client-side validation alone
- **Short expiration:** Use 2-minute token expiration
- **Rate limiting:** Combine with rate limiting for defense in depth
- **Monitoring:** Track CAPTCHA solve rates and failures

### 3. Performance

- **Lazy loading:** Load hCaptcha script only when needed
- **Caching:** Cache verification results appropriately
- **Fallback:** Handle API failures gracefully

## Monitoring

### Metrics to Track

1. **CAPTCHA Solve Rate**
   - Percentage of users who successfully complete CAPTCHA
   - Should be > 95% for good UX

2. **CAPTCHA Required Rate**
   - Percentage of requests requiring CAPTCHA
   - Baseline and alert on spikes

3. **Verification Failures**
   - Failed verification attempts
   - Investigate high rates

4. **Bot Detection Rate**
   - Requests flagged as bots
   - Validate detection accuracy

### Dashboard Queries

```typescript
// Get CAPTCHA metrics
const metrics = await prisma.securityEvent.groupBy({
  by: ['eventType'],
  where: {
    eventType: {
      in: ['suspicious_user_agent', 'captcha_verification_failed']
    },
    createdAt: { gte: since }
  },
  _count: { id: true }
});
```

## Production Checklist

Before going live:

- [ ] Production hCaptcha account created
- [ ] Domain registered in hCaptcha dashboard
- [ ] Environment variables configured
- [ ] CSP headers allow hCaptcha
- [ ] CAPTCHA tested on staging
- [ ] Mobile experience verified
- [ ] Accessibility tested
- [ ] Monitoring configured
- [ ] Alert thresholds set
- [ ] Documentation reviewed
- [ ] Team trained on troubleshooting

## Support

- **hCaptcha Documentation:** https://docs.hcaptcha.com/
- **hCaptcha Support:** https://www.hcaptcha.com/support
- **Integration Issues:** Check `src/lib/captcha.ts` and `src/components/security/HCaptcha.tsx`

## Related Documentation

- [SECURITY_IMPLEMENTATION_GUIDE.md](./SECURITY_IMPLEMENTATION_GUIDE.md)
- [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md)
- [DDOS_PROTECTION_QUICKSTART.md](./DDOS_PROTECTION_QUICKSTART.md)
