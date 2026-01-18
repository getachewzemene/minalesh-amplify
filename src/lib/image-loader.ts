/**
 * Custom Image Loader for CDN Support
 * 
 * This loader enables integration with external CDN services like CloudFlare or AWS CloudFront.
 * By default, Vercel's built-in image optimization is used (recommended).
 * 
 * To use a custom CDN:
 * 1. Set NEXT_PUBLIC_CDN_URL in your environment variables
 * 2. Set NEXT_PUBLIC_CDN_PROVIDER to 'cloudflare' or 'cloudfront'
 * 3. Uncomment the loader configuration in next.config.js
 * 
 * @see https://nextjs.org/docs/api-reference/next/image#loader
 */

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Determine CDN provider from environment
 */
function getCDNProvider(): 'cloudflare' | 'cloudfront' | null {
  const provider = process.env.NEXT_PUBLIC_CDN_PROVIDER?.toLowerCase();
  if (provider === 'cloudflare' || provider === 'cloudfront') {
    return provider;
  }
  return null;
}

/**
 * Custom image loader function
 * Constructs optimized image URLs for external CDN
 */
export default function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  const provider = getCDNProvider();

  // If no CDN URL is configured, return the source as-is
  if (!cdnUrl || !provider) {
    return src;
  }

  const imageQuality = quality || 75;

  // Handle absolute URLs from remote sources
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // For CloudFlare Image Resizing
    if (provider === 'cloudflare') {
      return `${cdnUrl}/cdn-cgi/image/width=${width},quality=${imageQuality},format=auto/${src}`;
    }
    
    // For AWS CloudFront with Lambda@Edge
    if (provider === 'cloudfront') {
      const url = new URL(src);
      return `${cdnUrl}${url.pathname}?w=${width}&q=${imageQuality}`;
    }
  }

  // Handle relative URLs (local images)
  // For CloudFlare Image Resizing
  if (provider === 'cloudflare') {
    return `${cdnUrl}/cdn-cgi/image/width=${width},quality=${imageQuality},format=auto${src}`;
  }

  // For AWS CloudFront or other CDNs
  if (provider === 'cloudfront') {
    const params = new URLSearchParams();
    params.set('w', width.toString());
    params.set('q', imageQuality.toString());
    return `${cdnUrl}${src}?${params.toString()}`;
  }

  // Default fallback
  return src;
}
