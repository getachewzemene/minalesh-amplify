# CDN & Image Optimization Guide

**Document Version:** 1.0  
**Last Updated:** January 18, 2025  
**Status:** ✅ CONFIGURED

This guide covers the CDN and image optimization setup for the Minalesh marketplace, including configuration for Vercel's built-in optimization, CloudFlare, and AWS CloudFront.

---

## Table of Contents

1. [Overview](#overview)
2. [Vercel Image Optimization (Recommended)](#vercel-image-optimization-recommended)
3. [CloudFlare Integration](#cloudflare-integration)
4. [AWS CloudFront Integration](#aws-cloudfront-integration)
5. [Configuration Files](#configuration-files)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What's Included

The Minalesh marketplace now includes comprehensive CDN and image optimization configuration:

✅ **Vercel Built-in Optimization** (Default)
- Automatic image optimization with WebP and AVIF support
- Responsive images with multiple device sizes
- Edge caching with long TTL (60 days)
- Automatic format selection based on browser support

✅ **CloudFlare Ready**
- Configuration for CloudFlare Image Resizing
- Custom loader support
- CDN integration via environment variables

✅ **AWS CloudFront Ready**
- CloudFront distribution configuration
- S3 bucket integration
- Cache invalidation support

✅ **Security Headers**
- SVG security policies
- Content disposition headers
- Comprehensive security headers via `vercel.json`

---

## Vercel Image Optimization (Recommended)

### Overview

Vercel provides built-in image optimization that works automatically without additional configuration. This is the **recommended approach** for most deployments.

### Features

- ✅ Automatic format conversion (AVIF, WebP, JPEG)
- ✅ Automatic image resizing based on device
- ✅ Edge caching via Vercel's global CDN
- ✅ Lazy loading support
- ✅ Blur placeholder support
- ✅ No additional cost on Pro/Enterprise plans

### Configuration

The image optimization is already configured in `next.config.js`:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 5184000, // 60 days
  dangerouslyAllowSVG: true,
}
```

### Usage in Components

Use the Next.js `Image` component for automatic optimization:

```tsx
import Image from 'next/image';

export function ProductCard({ product }) {
  return (
    <Image
      src={product.image}
      alt={product.name}
      width={300}
      height={300}
      quality={75}
      priority={false} // Use true for above-the-fold images
      placeholder="blur"
      blurDataURL={product.blurDataURL}
    />
  );
}
```

### Caching Strategy

Vercel automatically caches optimized images:

1. **Browser Cache**: 60 days (configured via `minimumCacheTTL`)
2. **Edge Cache**: Indefinite (until purged or updated)
3. **Cache Headers**: Set in `vercel.json` for static assets

---

## CloudFlare Integration

### Overview

CloudFlare can be used as an alternative CDN with image optimization capabilities.

### Setup Steps

#### 1. CloudFlare Account Setup

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain to CloudFlare
3. Update nameservers at your domain registrar
4. Enable Image Resizing (requires paid plan)

#### 2. CloudFlare Configuration

**Enable Image Resizing:**
- Go to Speed → Optimization → Image Resizing
- Enable "Image Resizing"
- Configure cache settings

**Enable Polish (Optional):**
- Go to Speed → Optimization → Polish
- Select "Lossless" or "Lossy"
- Enable WebP conversion

#### 3. Application Configuration

Set the CDN URL and provider in your environment:

```bash
NEXT_PUBLIC_CDN_URL=https://yoursite.com
NEXT_PUBLIC_CDN_PROVIDER=cloudflare
```

Uncomment the custom loader in `next.config.js`:

```javascript
images: {
  loader: 'custom',
  loaderFile: './src/lib/image-loader.ts',
}
```

#### 4. Page Rules

Create CloudFlare Page Rules for optimal caching:

**Rule 1: Cache Everything for Images**
- URL Pattern: `*yoursite.com/_next/image*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month

**Rule 2: Cache Static Assets**
- URL Pattern: `*yoursite.com/_next/static/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year

### CloudFlare Image Resizing API

CloudFlare will automatically resize images using this URL format:

```
https://yoursite.com/cdn-cgi/image/width=300,quality=75,format=auto/path/to/image.jpg
```

This is handled automatically by the custom loader in `src/lib/image-loader.ts`.

---

## AWS CloudFront Integration

### Overview

AWS CloudFront provides a robust CDN solution with deep integration with S3 and other AWS services.

### Setup Steps

#### 1. S3 Bucket Configuration

Create and configure an S3 bucket for image storage:

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

**Bucket Policy (Public Read):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**Enable CORS:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### 2. CloudFront Distribution

**Create Distribution:**

1. Go to AWS CloudFront console
2. Click "Create Distribution"
3. Configure origin:
   - **Origin Domain**: your-bucket-name.s3.amazonaws.com
   - **Origin Path**: (leave empty)
   - **Origin Access**: Public
4. Configure cache behavior:
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: Create custom or use Managed-CachingOptimized
   - **Compress Objects Automatically**: Yes

**Custom Cache Policy:**

```yaml
Name: ImageOptimizationPolicy
Minimum TTL: 1 day
Maximum TTL: 365 days
Default TTL: 60 days
Cache keys:
  - Query strings: All
  - Headers: Accept
  - Cookies: None
```

**Response Headers Policy:**

```yaml
Name: ImageSecurityHeaders
Custom headers:
  - Cache-Control: public, max-age=31536000, immutable
  - X-Content-Type-Options: nosniff
Security headers:
  - Strict-Transport-Security: max-age=31536000
```

#### 3. Application Configuration

Set environment variables:

```bash
# S3 Configuration
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-key

# CloudFront Configuration
NEXT_PUBLIC_CDN_URL=https://d1234567890abc.cloudfront.net
NEXT_PUBLIC_CDN_PROVIDER=cloudfront
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

Uncomment the custom loader in `next.config.js`:

```javascript
images: {
  loader: 'custom',
  loaderFile: './src/lib/image-loader.ts',
}
```

#### 4. Cache Invalidation

Invalidate CloudFront cache when updating images:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/_next/image/*" "/uploads/*"
```

**Automated Invalidation (Optional):**

Create a Lambda function or use AWS SDK to invalidate cache on S3 upload:

```typescript
import { CloudFront } from '@aws-sdk/client-cloudfront';

async function invalidateCache(paths: string[]) {
  const cloudfront = new CloudFront({ region: 'us-east-1' });
  
  await cloudfront.createInvalidation({
    DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
    },
  });
}
```

---

## Configuration Files

### vercel.json

The `vercel.json` file configures caching headers and routing:

```json
{
  "headers": [
    {
      "source": "/_next/image(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/uploads/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=2592000"
        }
      ]
    }
  ]
}
```

### next.config.js

The `next.config.js` file configures Next.js image optimization:

```javascript
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 5184000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

---

## Best Practices

### Image Format Selection

1. **AVIF First**: Modern browsers get smaller, high-quality AVIF images
2. **WebP Fallback**: Older browsers get WebP (still 25-35% smaller than JPEG)
3. **JPEG/PNG Fallback**: Legacy browsers get original format

### Image Sizing

1. **Use Responsive Images**: Let Next.js handle device-specific sizes
2. **Specify Dimensions**: Always provide width/height to prevent layout shift
3. **Quality Settings**:
   - Product images: 75-80
   - Hero images: 85-90
   - Thumbnails: 70-75

### Lazy Loading

```tsx
// Above the fold (hero images)
<Image priority={true} loading="eager" />

// Below the fold (product grids)
<Image loading="lazy" />
```

### Blur Placeholders

Generate blur data URLs for better UX:

```tsx
import { getPlaiceholder } from 'plaiceholder';

export async function getBase64(imageUrl: string) {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const { base64 } = await getPlaiceholder(Buffer.from(buffer));
  return base64;
}

// Usage
<Image
  src={product.image}
  placeholder="blur"
  blurDataURL={product.blurDataURL}
/>
```

### File Size Limits

- **Maximum file size**: 10MB per image (configurable)
- **Recommended size**: < 2MB for products, < 500KB for thumbnails
- **Compression**: Use tools like ImageOptim or TinyPNG before upload

### Remote Patterns

Configure allowed image domains in `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-bucket-name.s3.amazonaws.com',
    },
    {
      protocol: 'https',
      hostname: '*.cloudfront.net',
    },
  ],
}
```

---

## Troubleshooting

### Images Not Loading

**Issue**: Images return 404 or fail to load

**Solutions**:
1. Check remote patterns in `next.config.js`
2. Verify S3 bucket permissions
3. Check CloudFront distribution status
4. Verify CORS configuration on S3

### Slow Image Loading

**Issue**: Images load slowly or time out

**Solutions**:
1. Check image file sizes (should be < 2MB)
2. Verify CDN is properly configured
3. Check cache hit ratio in CloudFront/CloudFlare
4. Consider using WebP/AVIF formats

### Cache Not Working

**Issue**: Images aren't being cached

**Solutions**:
1. Verify cache headers in browser DevTools
2. Check `vercel.json` header configuration
3. Verify CloudFront cache behaviors
4. Check CloudFlare page rules

### Image Quality Issues

**Issue**: Images appear blurry or low quality

**Solutions**:
1. Increase quality parameter (default: 75)
2. Use higher resolution source images
3. Check format conversion (AVIF/WebP vs JPEG)
4. Verify device size selection

---

## Performance Metrics

### Expected Performance

With proper CDN configuration:

- **Time to First Byte (TTFB)**: < 200ms
- **Image Load Time**: < 500ms (cached), < 2s (uncached)
- **Cache Hit Ratio**: > 90%
- **Bandwidth Savings**: 40-60% (with AVIF/WebP)

### Monitoring

Monitor CDN performance:

1. **Vercel Analytics**: Built-in performance metrics
2. **CloudFlare Analytics**: Cache ratio, bandwidth, requests
3. **AWS CloudFront Metrics**: Cache hit ratio, request count, data transfer
4. **Lighthouse**: Core Web Vitals (LCP, CLS, FID)

---

## Production Checklist

Before deploying to production:

- [ ] Configure CDN (Vercel/CloudFlare/CloudFront)
- [ ] Set cache headers in `vercel.json`
- [ ] Enable image optimization in `next.config.js`
- [ ] Test image loading across devices
- [ ] Verify cache hit ratios
- [ ] Test with slow 3G connection
- [ ] Run Lighthouse audit
- [ ] Set up monitoring and alerts
- [ ] Configure cache invalidation workflow
- [ ] Document CDN setup for team

---

## Additional Resources

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [CloudFlare Image Resizing](https://developers.cloudflare.com/images/image-resizing/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

**Document Maintainer:** Development Team  
**Next Review:** After production deployment
