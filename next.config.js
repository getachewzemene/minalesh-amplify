const { withSentryConfig } = require('@sentry/nextjs');

// Production-safe image domains configuration
// Set NODE_ENV=production and configure these domains for your deployment
const getRemotePatterns = () => {
  // In production, use specific allowed domains
  if (process.env.NODE_ENV === 'production' && process.env.IMAGE_DOMAINS) {
    const domains = process.env.IMAGE_DOMAINS
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0); // Filter out empty strings
    
    if (domains.length === 0) {
      throw new Error(
        'IMAGE_DOMAINS is set but empty in production. ' +
        'Please provide at least one allowed image domain. ' +
        'Example: IMAGE_DOMAINS="your-bucket.s3.amazonaws.com,cdn.yoursite.com"'
      );
    }
    
    return domains.map(hostname => ({
      protocol: 'https',
      hostname,
    }));
  }
  
  // For development and testing, allow all HTTPS sources
  return [
    {
      protocol: 'https',
      hostname: '**',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
    },
  ];
};

// Cache duration constants
const SIXTY_DAYS_IN_SECONDS = 60 * 24 * 60 * 60; // 5,184,000 seconds

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization with CDN support
  images: {
    // Dynamic remote patterns based on environment
    // In production: Set IMAGE_DOMAINS="your-bucket.s3.amazonaws.com,*.cloudfront.net"
    // In development: Allows all HTTPS sources for flexibility
    remotePatterns: getRemotePatterns(),
    // Enable modern image formats with automatic format selection
    formats: ['image/avif', 'image/webp'],
    // Configure responsive image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 60 days (browser and CDN)
    minimumCacheTTL: SIXTY_DAYS_IN_SECONDS,
    // Allow SVG images (useful for logos and icons)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Custom loader for CDN (requires both NEXT_PUBLIC_CDN_URL and NEXT_PUBLIC_CDN_PROVIDER)
    // Uncomment the lines below to enable custom CDN integration
    // loader: process.env.NEXT_PUBLIC_CDN_URL && process.env.NEXT_PUBLIC_CDN_PROVIDER ? 'custom' : 'default',
    // loaderFile: process.env.NEXT_PUBLIC_CDN_URL && process.env.NEXT_PUBLIC_CDN_PROVIDER ? './src/lib/image-loader.ts' : undefined,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        // Cache static assets
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Experimental features for better performance
  experimental: {
    // Enable instrumentation for startup validation
    instrumentationHook: true,
    // Enable optimizations
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Exclude logging packages from bundling to avoid worker thread issues
    // This fixes the "Cannot find module worker.js" error with pino-pretty
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  },
  
  // Webpack configuration to prevent bundling of worker threads
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark logging packages as external to prevent bundling worker threads
      config.externals = config.externals || [];
      config.externals.push({
        'pino': 'commonjs pino',
        'pino-pretty': 'commonjs pino-pretty',
        'thread-stream': 'commonjs thread-stream',
      });

      // Ignore noisy warnings from instrumentation packages on the server
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/require-in-the-middle/ },
        { module: /node_modules\/@opentelemetry/ },
      ];
    }
    return config;
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== 'production',
};

// Export with Sentry if DSN is configured
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
