/**
 * Custom Image Loader for CDN Support
 * 
 * This loader enables integration with external CDN services like CloudFlare or AWS CloudFront.
 * By default, Vercel's built-in image optimization is used (recommended).
 * 
 * To use a custom CDN:
 * 1. Set NEXT_PUBLIC_CDN_URL in your environment variables
 * 2. Uncomment the loader configuration in next.config.js
 * 
 * @see https://nextjs.org/docs/api-reference/next/image#loader
 */

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader function
 * Constructs optimized image URLs for external CDN
 */
export default function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  // If no CDN URL is configured, return the source as-is
  if (!cdnUrl) {
    return src;
  }

  // Handle absolute URLs from remote sources
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // For CloudFlare Image Resizing
    if (cdnUrl.includes('cloudflare')) {
      return `${cdnUrl}/cdn-cgi/image/width=${width},quality=${quality || 75},format=auto/${src}`;
    }
    
    // For AWS CloudFront with Lambda@Edge
    if (cdnUrl.includes('cloudfront')) {
      const url = new URL(src);
      return `${cdnUrl}${url.pathname}?w=${width}&q=${quality || 75}`;
    }
    
    // Default: append query parameters
    return `${src}?w=${width}&q=${quality || 75}`;
  }

  // Handle relative URLs (local images)
  const params = new URLSearchParams();
  params.set('w', width.toString());
  if (quality) {
    params.set('q', quality.toString());
  }

  // For CloudFlare Image Resizing
  if (cdnUrl.includes('cloudflare')) {
    return `${cdnUrl}/cdn-cgi/image/width=${width},quality=${quality || 75},format=auto${src}`;
  }

  // For AWS CloudFront or other CDNs
  return `${cdnUrl}${src}?${params.toString()}`;
}
