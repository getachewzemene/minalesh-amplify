/**
 * Geographic Blocking Module
 * 
 * Provides IP geolocation and country/region-based blocking capabilities.
 * Uses ip2location or ipapi for geolocation lookups.
 */

import prisma from './prisma';
import { getRedisClient } from './redis';

interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface GeoBlockConfig {
  blockedCountries: string[];  // ISO country codes
  blockedRegions: string[];    // Region names
  allowedCountries?: string[]; // If set, only these are allowed
}

// Cache geo lookups for 24 hours
const GEO_CACHE_TTL = 24 * 60 * 60;

/**
 * Get geolocation data for an IP address
 */
export async function getGeoLocation(ipAddress: string): Promise<GeoLocation | null> {
  // Check cache first
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(`geo:${ipAddress}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }

  // Use free IP geolocation service (ipapi.co)
  // In production, consider using paid service for better reliability
  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'Minalesh-Marketplace/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Geolocation API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error('Geolocation error:', data.reason);
      return null;
    }

    const geoData: GeoLocation = {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX',
      region: data.region || '',
      city: data.city || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
    };

    // Cache the result
    if (redis) {
      try {
        await redis.setex(
          `geo:${ipAddress}`,
          GEO_CACHE_TTL,
          JSON.stringify(geoData)
        );
      } catch (error) {
        console.error('Redis cache set error:', error);
      }
    }

    return geoData;
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return null;
  }
}

/**
 * Get geo-blocking configuration from database or environment
 */
export async function getGeoBlockConfig(): Promise<GeoBlockConfig> {
  // Try to get from database first
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'geo_blocking' },
    });

    if (config && config.value) {
      return JSON.parse(config.value as string);
    }
  } catch (error) {
    console.error('Error fetching geo-block config:', error);
  }

  // Fallback to environment variables
  const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',').map(c => c.trim()) || [];
  const blockedRegions = process.env.BLOCKED_REGIONS?.split(',').map(r => r.trim()) || [];
  const allowedCountries = process.env.ALLOWED_COUNTRIES?.split(',').map(c => c.trim());

  return {
    blockedCountries,
    blockedRegions,
    allowedCountries,
  };
}

/**
 * Check if IP address should be blocked based on geographic location
 */
export async function isGeoBlocked(ipAddress: string): Promise<{
  blocked: boolean;
  reason?: string;
  location?: GeoLocation;
}> {
  // Skip localhost and private IPs
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return { blocked: false };
  }

  // Get geolocation
  const location = await getGeoLocation(ipAddress);
  
  if (!location) {
    // If we can't determine location, allow by default (fail open)
    return { blocked: false };
  }

  // Get blocking configuration
  const config = await getGeoBlockConfig();

  // Check whitelist first (if configured)
  if (config.allowedCountries && config.allowedCountries.length > 0) {
    if (!config.allowedCountries.includes(location.countryCode)) {
      return {
        blocked: true,
        reason: `Country ${location.country} not in allowed list`,
        location,
      };
    }
  }

  // Check blocked countries
  if (config.blockedCountries.includes(location.countryCode)) {
    return {
      blocked: true,
      reason: `Country ${location.country} is blocked`,
      location,
    };
  }

  // Check blocked regions
  if (location.region && config.blockedRegions.some(r => 
    location.region.toLowerCase().includes(r.toLowerCase())
  )) {
    return {
      blocked: true,
      reason: `Region ${location.region} is blocked`,
      location,
    };
  }

  return { blocked: false, location };
}

/**
 * Log geographic blocking event
 */
export async function logGeoBlock(
  ipAddress: string,
  location: GeoLocation,
  reason: string,
  endpoint?: string
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        ipAddress,
        eventType: 'geo_blocked',
        severity: 'high',
        endpoint,
        metadata: {
          country: location.country,
          countryCode: location.countryCode,
          region: location.region,
          city: location.city,
          reason,
        },
        resolved: false,
      },
    });

    // Send alert for geo-blocks
    const { alertSecurityEvent } = await import('./security-alerts');
    await alertSecurityEvent(
      'geo_blocked',
      'high',
      ipAddress,
      null,
      endpoint,
      { reason, country: location.country }
    );
  } catch (error) {
    console.error('Error logging geo-block:', error);
  }
}

/**
 * Update geo-blocking configuration
 */
export async function updateGeoBlockConfig(
  config: GeoBlockConfig,
  updatedBy: string
): Promise<void> {
  try {
    await prisma.siteConfig.upsert({
      where: { key: 'geo_blocking' },
      update: {
        value: JSON.stringify(config),
        updatedAt: new Date(),
      },
      create: {
        key: 'geo_blocking',
        value: JSON.stringify(config),
        description: 'Geographic blocking configuration',
      },
    });

    // Log the configuration change
    await prisma.securityEvent.create({
      data: {
        ipAddress: '0.0.0.0',
        eventType: 'geo_config_updated',
        severity: 'low',
        metadata: {
          updatedBy,
          config,
        },
        resolved: true,
      },
    });
  } catch (error) {
    console.error('Error updating geo-block config:', error);
    throw error;
  }
}

/**
 * Get geographic statistics for security dashboard
 */
export async function getGeoStatistics(since: Date): Promise<{
  topCountries: Array<{ country: string; count: number }>;
  topRegions: Array<{ region: string; count: number }>;
  blockedByCountry: Array<{ country: string; count: number }>;
}> {
  try {
    // Get all security events with geographic data
    const events = await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: since },
        metadata: { path: '$.country', not: prisma.DbNull },
      },
      select: {
        metadata: true,
        eventType: true,
      },
    });

    const countryCount: Record<string, number> = {};
    const regionCount: Record<string, number> = {};
    const blockedCount: Record<string, number> = {};

    events.forEach((event) => {
      const metadata = event.metadata as any;
      const country = metadata?.country || 'Unknown';
      const region = metadata?.region || 'Unknown';

      countryCount[country] = (countryCount[country] || 0) + 1;
      if (region) {
        regionCount[region] = (regionCount[region] || 0) + 1;
      }

      if (event.eventType === 'geo_blocked') {
        blockedCount[country] = (blockedCount[country] || 0) + 1;
      }
    });

    const topCountries = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topRegions = Object.entries(regionCount)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const blockedByCountry = Object.entries(blockedCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      topCountries,
      topRegions,
      blockedByCountry,
    };
  } catch (error) {
    console.error('Error fetching geo statistics:', error);
    return {
      topCountries: [],
      topRegions: [],
      blockedByCountry: [],
    };
  }
}
