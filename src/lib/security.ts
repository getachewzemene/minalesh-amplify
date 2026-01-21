/**
 * Security & DDoS Protection Module
 * 
 * Provides IP management, bot detection, and security event tracking.
 */

import prisma from './prisma';
import { redisCache } from './redis';

// Cache TTL for IP lists (5 minutes)
const IP_CACHE_TTL = 300;

/**
 * Check if IP is whitelisted
 */
export async function isIpWhitelisted(ipAddress: string): Promise<boolean> {
  // Check cache first
  const cacheKey = `ip:whitelist:${ipAddress}`;
  const cached = await redisCache.get<boolean>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check database
  const entry = await prisma.ipWhitelist.findFirst({
    where: {
      ipAddress,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  const isWhitelisted = !!entry;
  
  // Cache result
  await redisCache.set(cacheKey, isWhitelisted, IP_CACHE_TTL);
  
  return isWhitelisted;
}

/**
 * Check if IP is blacklisted
 */
export async function isIpBlacklisted(ipAddress: string): Promise<{
  isBlacklisted: boolean;
  reason?: string;
  severity?: string;
}> {
  // Check cache first
  const cacheKey = `ip:blacklist:${ipAddress}`;
  const cached = await redisCache.get<{ isBlacklisted: boolean; reason?: string; severity?: string }>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check database
  const entry = await prisma.ipBlacklist.findFirst({
    where: {
      ipAddress,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  const result = {
    isBlacklisted: !!entry,
    reason: entry?.reason,
    severity: entry?.severity
  };

  // Update block count if blacklisted
  if (entry) {
    await prisma.ipBlacklist.update({
      where: { id: entry.id },
      data: {
        blockCount: { increment: 1 },
        lastBlockedAt: new Date()
      }
    }).catch(() => {
      // Ignore errors to avoid blocking the request
    });
  }

  // Cache result
  await redisCache.set(cacheKey, result, IP_CACHE_TTL);
  
  return result;
}

/**
 * Add IP to whitelist
 */
export async function addIpToWhitelist(
  ipAddress: string,
  reason: string,
  createdBy?: string,
  expiresAt?: Date
): Promise<void> {
  await prisma.ipWhitelist.upsert({
    where: { ipAddress },
    create: {
      ipAddress,
      reason,
      createdBy,
      expiresAt,
      isActive: true
    },
    update: {
      reason,
      createdBy,
      expiresAt,
      isActive: true
    }
  });

  // Clear cache
  await redisCache.del(`ip:whitelist:${ipAddress}`);
}

/**
 * Add IP to blacklist
 */
export async function addIpToBlacklist(
  ipAddress: string,
  reason: string,
  severity: string = 'medium',
  createdBy?: string,
  expiresAt?: Date
): Promise<void> {
  await prisma.ipBlacklist.upsert({
    where: { ipAddress },
    create: {
      ipAddress,
      reason,
      severity,
      createdBy,
      expiresAt,
      isActive: true,
      blockCount: 0
    },
    update: {
      reason,
      severity,
      createdBy,
      expiresAt,
      isActive: true
    }
  });

  // Clear cache
  await redisCache.del(`ip:blacklist:${ipAddress}`);
}

/**
 * Remove IP from whitelist
 */
export async function removeIpFromWhitelist(ipAddress: string): Promise<void> {
  await prisma.ipWhitelist.updateMany({
    where: { ipAddress },
    data: { isActive: false }
  });

  // Clear cache
  await redisCache.del(`ip:whitelist:${ipAddress}`);
}

/**
 * Remove IP from blacklist
 */
export async function removeIpFromBlacklist(ipAddress: string): Promise<void> {
  await prisma.ipBlacklist.updateMany({
    where: { ipAddress },
    data: { isActive: false }
  });

  // Clear cache
  await redisCache.del(`ip:blacklist:${ipAddress}`);
}

/**
 * Bot detection based on User-Agent
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) {
    return true; // No user agent is suspicious
  }

  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java(?!script)/i, // Java but not JavaScript
    /go-http/i,
    /node-fetch/i,
    /axios/i,
    /okhttp/i,
    /libwww/i,
    /mechanize/i,
    /phantom/i,
    /headless/i
  ];

  // Check for known good bots (search engines, monitoring services)
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /uptimerobot/i,
    /pingdom/i,
    /newrelic/i
  ];

  // First check if it's an allowed bot
  for (const pattern of allowedBots) {
    if (pattern.test(userAgent)) {
      return false; // Allowed bot
    }
  }

  // Then check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if request pattern is suspicious
 */
export async function analyzeRequestPattern(
  ipAddress: string,
  endpoint: string
): Promise<{
  isSuspicious: boolean;
  reason?: string;
}> {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Track request timestamps in Redis
  const key = `request:pattern:${ipAddress}`;
  const client = await import('./redis').then(m => m.getRedisClient());
  
  if (!client) {
    return { isSuspicious: false };
  }

  try {
    // Add current timestamp
    await client.zadd(key, now, `${now}`);
    
    // Remove old entries
    await client.zremrangebyscore(key, '-inf', oneMinuteAgo);
    
    // Set expiry
    await client.expire(key, 120);
    
    // Get request count in last minute
    const count = await client.zcard(key);

    // Check for suspicious patterns
    if (count > 60) {
      return {
        isSuspicious: true,
        reason: 'Excessive requests per minute'
      };
    }

    // Check for same endpoint pattern
    const endpointKey = `request:endpoint:${ipAddress}:${endpoint}`;
    await client.incr(endpointKey);
    await client.expire(endpointKey, 60);
    
    const endpointCount = await client.get(endpointKey);
    if (endpointCount && parseInt(endpointCount) > 30) {
      return {
        isSuspicious: true,
        reason: 'Excessive requests to same endpoint'
      };
    }

    return { isSuspicious: false };
  } catch (error) {
    // If Redis fails, don't block the request
    return { isSuspicious: false };
  }
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  ipAddress: string,
  eventType: string,
  severity: string = 'low',
  userAgent?: string | null,
  endpoint?: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        ipAddress,
        eventType,
        severity,
        userAgent: userAgent || undefined,
        endpoint,
        metadata: metadata ? metadata : undefined,
        resolved: false
      }
    });

    // Auto-blacklist on critical events
    if (severity === 'critical') {
      await addIpToBlacklist(
        ipAddress,
        `Auto-blacklisted: ${eventType}`,
        severity,
        'system',
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      );
    }
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to log security event:', error);
  }
}

/**
 * Check for Cloudflare headers and extract real IP
 */
export function getCloudflareInfo(request: Request): {
  isCloudflare: boolean;
  realIp?: string;
  country?: string;
  isThreat?: boolean;
} {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const cfIpCountry = request.headers.get('cf-ipcountry');
  const cfRay = request.headers.get('cf-ray');
  const cfVisitor = request.headers.get('cf-visitor');
  const cfThreatScore = request.headers.get('cf-threat-score');

  const isCloudflare = !!(cfConnectingIp || cfRay);

  return {
    isCloudflare,
    realIp: cfConnectingIp || undefined,
    country: cfIpCountry || undefined,
    isThreat: cfThreatScore ? parseInt(cfThreatScore) > 50 : undefined
  };
}

/**
 * Comprehensive security check for incoming requests
 */
export async function performSecurityCheck(
  request: Request,
  ipAddress: string,
  endpoint?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  severity?: string;
  requiresCaptcha?: boolean;
}> {
  // Check Cloudflare threat detection
  const cfInfo = getCloudflareInfo(request);
  if (cfInfo.isCloudflare && cfInfo.isThreat) {
    await logSecurityEvent(
      ipAddress,
      'cloudflare_threat_detected',
      'high',
      request.headers.get('user-agent'),
      endpoint
    );
    return {
      allowed: false,
      reason: 'Security threat detected',
      severity: 'high',
      requiresCaptcha: true
    };
  }

  // Use Cloudflare IP if available
  const realIp = cfInfo.realIp || ipAddress;

  // Check whitelist first (bypass all other checks)
  const isWhitelisted = await isIpWhitelisted(realIp);
  if (isWhitelisted) {
    return { allowed: true };
  }

  // Check blacklist
  const blacklistResult = await isIpBlacklisted(realIp);
  if (blacklistResult.isBlacklisted) {
    await logSecurityEvent(
      realIp,
      'blacklist_block',
      blacklistResult.severity || 'medium',
      request.headers.get('user-agent'),
      endpoint,
      { reason: blacklistResult.reason }
    );
    return {
      allowed: false,
      reason: blacklistResult.reason || 'IP blocked',
      severity: blacklistResult.severity
    };
  }

  // Check user agent
  const userAgent = request.headers.get('user-agent');
  const isSuspicious = isSuspiciousUserAgent(userAgent);
  if (isSuspicious) {
    await logSecurityEvent(
      realIp,
      'suspicious_user_agent',
      'medium',
      userAgent,
      endpoint
    );
    // Don't block yet, but require CAPTCHA
    return {
      allowed: true,
      requiresCaptcha: true,
      reason: 'Suspicious user agent detected'
    };
  }

  // Analyze request pattern
  if (endpoint) {
    const patternAnalysis = await analyzeRequestPattern(realIp, endpoint);
    if (patternAnalysis.isSuspicious) {
      await logSecurityEvent(
        realIp,
        'suspicious_pattern',
        'high',
        userAgent,
        endpoint,
        { reason: patternAnalysis.reason }
      );
      return {
        allowed: true,
        requiresCaptcha: true,
        reason: patternAnalysis.reason
      };
    }
  }

  return { allowed: true };
}
