/**
 * ML-Based Anomaly Detection Framework
 * 
 * Provides statistical and machine learning-based anomaly detection for security events.
 * This is a foundation that can be extended with more sophisticated ML models.
 */

import prisma from './prisma';
import { getRedisClient } from './redis';

interface UserBehaviorProfile {
  userId?: string;
  ipAddress: string;
  avgRequestsPerHour: number;
  avgRequestsPerEndpoint: number;
  commonEndpoints: string[];
  commonUserAgents: string[];
  typicalHours: number[]; // Hours of day (0-23)
  typicalDaysOfWeek: number[]; // Days of week (0-6)
  firstSeen: Date;
  lastSeen: Date;
  requestCount: number;
}

interface AnomalyScore {
  score: number; // 0-100, higher = more anomalous
  factors: string[];
  isAnomaly: boolean; // true if score > threshold
  confidence: number; // 0-1
}

const ANOMALY_THRESHOLD = 70; // Score above this is considered anomalous
const PROFILE_CACHE_TTL = 3600; // 1 hour

/**
 * Calculate baseline behavior profile for a user/IP
 */
export async function calculateBehaviorProfile(
  identifier: string,
  type: 'user' | 'ip'
): Promise<UserBehaviorProfile | null> {
  try {
    // Look back 30 days for behavior patterns
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get security events for this identifier
    const events = await prisma.securityEvent.findMany({
      where: {
        ...(type === 'ip' ? { ipAddress: identifier } : {}),
        createdAt: { gte: since },
      },
      select: {
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
      take: 1000, // Limit for performance
    });

    if (events.length < 10) {
      // Not enough data for profiling
      return null;
    }

    // Calculate statistics
    const endpointCounts: Record<string, number> = {};
    const userAgentCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    events.forEach((event) => {
      if (event.endpoint) {
        endpointCounts[event.endpoint] = (endpointCounts[event.endpoint] || 0) + 1;
      }
      if (event.userAgent) {
        userAgentCounts[event.userAgent] = (userAgentCounts[event.userAgent] || 0) + 1;
      }

      const hour = event.createdAt.getHours();
      const day = event.createdAt.getDay();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Find common patterns
    const commonEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint]) => endpoint);

    const commonUserAgents = Object.entries(userAgentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ua]) => ua);

    const typicalHours = Object.entries(hourCounts)
      .filter(([, count]) => count > events.length * 0.05) // Active in this hour at least 5% of the time
      .map(([hour]) => parseInt(hour));

    const typicalDaysOfWeek = Object.entries(dayCounts)
      .filter(([, count]) => count > events.length * 0.1) // Active on this day at least 10% of the time
      .map(([day]) => parseInt(day));

    const firstSeen = events[events.length - 1].createdAt;
    const lastSeen = events[0].createdAt;
    const hoursDiff = (lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60);

    const profile: UserBehaviorProfile = {
      ...(type === 'user' ? { userId: identifier } : {}),
      ipAddress: type === 'ip' ? identifier : '',
      avgRequestsPerHour: events.length / (hoursDiff || 1),
      avgRequestsPerEndpoint: events.length / Object.keys(endpointCounts).length,
      commonEndpoints,
      commonUserAgents,
      typicalHours,
      typicalDaysOfWeek,
      firstSeen,
      lastSeen,
      requestCount: events.length,
    };

    // Cache the profile
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.setex(
          `behavior_profile:${type}:${identifier}`,
          PROFILE_CACHE_TTL,
          JSON.stringify(profile)
        );
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    return profile;
  } catch (error) {
    console.error('Error calculating behavior profile:', error);
    return null;
  }
}

/**
 * Get cached behavior profile or calculate new one
 */
async function getBehaviorProfile(
  identifier: string,
  type: 'user' | 'ip'
): Promise<UserBehaviorProfile | null> {
  // Check cache
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(`behavior_profile:${type}:${identifier}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }

  // Calculate new profile
  return calculateBehaviorProfile(identifier, type);
}

/**
 * Detect anomalies in current request based on behavior profile
 */
export async function detectAnomaly(
  ipAddress: string,
  userAgent: string | null,
  endpoint: string,
  userId?: string
): Promise<AnomalyScore> {
  const factors: string[] = [];
  let score = 0;

  // Get behavior profile
  const profile = await getBehaviorProfile(
    userId || ipAddress,
    userId ? 'user' : 'ip'
  );

  if (!profile) {
    // No profile available, use simple heuristics
    return {
      score: 0,
      factors: ['No historical data for profiling'],
      isAnomaly: false,
      confidence: 0.1,
    };
  }

  // Check endpoint anomaly
  if (endpoint && !profile.commonEndpoints.includes(endpoint)) {
    score += 20;
    factors.push('Accessing unusual endpoint');
  }

  // Check user agent anomaly
  if (userAgent && !profile.commonUserAgents.some(ua => userAgent.includes(ua))) {
    score += 25;
    factors.push('Using unusual user agent');
  }

  // Check time-of-day anomaly
  const currentHour = new Date().getHours();
  if (!profile.typicalHours.includes(currentHour)) {
    score += 15;
    factors.push('Activity at unusual time of day');
  }

  // Check day-of-week anomaly
  const currentDay = new Date().getDay();
  if (!profile.typicalDaysOfWeek.includes(currentDay)) {
    score += 10;
    factors.push('Activity on unusual day of week');
  }

  // Check if new account (potential bot)
  const accountAge = Date.now() - profile.firstSeen.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (accountAge < oneDay && profile.requestCount > 100) {
    score += 30;
    factors.push('High activity from new account');
  }

  // Check request rate
  const recentActivity = await getRecentActivityCount(ipAddress, 60); // Last 60 minutes
  if (recentActivity > profile.avgRequestsPerHour * 3) {
    score += 25;
    factors.push('Request rate significantly above baseline');
  }

  // Calculate confidence based on data quality
  const dataQuality = Math.min(profile.requestCount / 100, 1);
  const confidence = dataQuality * 0.8 + 0.2; // Min 0.2, max 1.0

  return {
    score: Math.min(score, 100),
    factors,
    isAnomaly: score >= ANOMALY_THRESHOLD,
    confidence,
  };
}

/**
 * Get recent activity count for an IP
 */
async function getRecentActivityCount(ipAddress: string, minutes: number): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  try {
    const count = await prisma.securityEvent.count({
      where: {
        ipAddress,
        createdAt: { gte: since },
      },
    });

    return count;
  } catch (error) {
    console.error('Error counting recent activity:', error);
    return 0;
  }
}

/**
 * Log anomaly detection event
 */
export async function logAnomaly(
  ipAddress: string,
  anomalyScore: AnomalyScore,
  endpoint?: string,
  userAgent?: string | null
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        ipAddress,
        eventType: 'anomaly_detected',
        severity: anomalyScore.score > 85 ? 'high' : 'medium',
        endpoint,
        userAgent: userAgent || undefined,
        metadata: {
          score: anomalyScore.score,
          factors: anomalyScore.factors,
          confidence: anomalyScore.confidence,
        },
        resolved: false,
      },
    });

    // Send alert for high-score anomalies
    if (anomalyScore.score > 85) {
      const { alertSecurityEvent } = await import('./security-alerts');
      await alertSecurityEvent(
        'anomaly_detected',
        'high',
        ipAddress,
        userAgent,
        endpoint,
        {
          score: anomalyScore.score,
          factors: anomalyScore.factors.join(', '),
        }
      );
    }
  } catch (error) {
    console.error('Error logging anomaly:', error);
  }
}

/**
 * Get anomaly statistics for dashboard
 */
export async function getAnomalyStatistics(since: Date): Promise<{
  totalAnomalies: number;
  highScoreAnomalies: number;
  topFactors: Array<{ factor: string; count: number }>;
  avgScore: number;
}> {
  try {
    const anomalies = await prisma.securityEvent.findMany({
      where: {
        eventType: 'anomaly_detected',
        createdAt: { gte: since },
      },
      select: {
        metadata: true,
      },
    });

    const totalAnomalies = anomalies.length;
    const highScoreAnomalies = anomalies.filter(
      (a) => ((a.metadata as any)?.score || 0) > 85
    ).length;

    const factorCounts: Record<string, number> = {};
    let totalScore = 0;

    anomalies.forEach((anomaly) => {
      const metadata = anomaly.metadata as any;
      const score = metadata?.score || 0;
      const factors = metadata?.factors || [];

      totalScore += score;

      factors.forEach((factor: string) => {
        factorCounts[factor] = (factorCounts[factor] || 0) + 1;
      });
    });

    const topFactors = Object.entries(factorCounts)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgScore = totalAnomalies > 0 ? totalScore / totalAnomalies : 0;

    return {
      totalAnomalies,
      highScoreAnomalies,
      topFactors,
      avgScore,
    };
  } catch (error) {
    console.error('Error fetching anomaly statistics:', error);
    return {
      totalAnomalies: 0,
      highScoreAnomalies: 0,
      topFactors: [],
      avgScore: 0,
    };
  }
}

/**
 * Train/update behavior profiles for all active users/IPs
 * This should be run periodically (e.g., daily cron job)
 */
export async function updateAllBehaviorProfiles(): Promise<{
  updated: number;
  failed: number;
}> {
  try {
    // Get distinct IPs from recent activity (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const distinctIPs = await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: since },
      },
      distinct: ['ipAddress'],
      select: {
        ipAddress: true,
      },
    });

    let updated = 0;
    let failed = 0;

    for (const { ipAddress } of distinctIPs) {
      try {
        await calculateBehaviorProfile(ipAddress, 'ip');
        updated++;
      } catch (error) {
        console.error(`Failed to update profile for ${ipAddress}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  } catch (error) {
    console.error('Error updating behavior profiles:', error);
    return { updated: 0, failed: 0 };
  }
}
