/**
 * Feature Flags Service
 * Manage feature flags for controlled rollouts and CI/CD optimization
 */

import prisma from './prisma';

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  email?: string;
  environment?: string;
  [key: string]: unknown;
}

/**
 * Check if a feature flag is enabled for a given context
 */
export async function isFeatureEnabled(
  key: string,
  context?: FeatureFlagContext
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
  });

  if (!flag || !flag.isEnabled) {
    return false;
  }

  // Check if user is specifically targeted
  if (context?.userId && flag.targetUsers.length > 0) {
    if (flag.targetUsers.includes(context.userId)) {
      return true;
    }
    // If there are target users but current user isn't in the list
    // fall through to percentage check
  }

  // Check if user role is targeted
  if (context?.userRole && flag.targetRoles.length > 0) {
    if (!flag.targetRoles.includes(context.userRole)) {
      return false; // User's role is not in targeted roles
    }
  }

  // Check percentage rollout
  if (flag.percentage !== null && flag.percentage < 100) {
    // Use user ID for consistent bucketing, or random if no user
    const bucketKey = context?.userId || Math.random().toString();
    const hash = simpleHash(bucketKey + key);
    const bucket = hash % 100;
    return bucket < flag.percentage;
  }

  // Check complex conditions
  if (flag.conditions && typeof flag.conditions === 'object') {
    return evaluateConditions(flag.conditions as Record<string, unknown>, context || {});
  }

  return true;
}

/**
 * Simple hash function for consistent bucketing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Evaluate complex conditions
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  context: FeatureFlagContext
): boolean {
  // Simple condition matching
  for (const [key, value] of Object.entries(conditions)) {
    if (key === '$or' && Array.isArray(value)) {
      return value.some((cond) => 
        evaluateConditions(cond as Record<string, unknown>, context)
      );
    }
    if (key === '$and' && Array.isArray(value)) {
      return value.every((cond) => 
        evaluateConditions(cond as Record<string, unknown>, context)
      );
    }
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags() {
  return prisma.featureFlag.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get feature flag by key
 */
export async function getFeatureFlag(key: string) {
  return prisma.featureFlag.findUnique({
    where: { key },
  });
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(data: {
  key: string;
  name: string;
  description?: string;
  isEnabled?: boolean;
  percentage?: number;
  targetUsers?: string[];
  targetRoles?: string[];
  conditions?: Record<string, unknown>;
}) {
  return prisma.featureFlag.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      isEnabled: data.isEnabled ?? false,
      percentage: data.percentage ?? 100,
      targetUsers: data.targetUsers || [],
      targetRoles: data.targetRoles || [],
      conditions: data.conditions || null,
    },
  });
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  key: string,
  updates: Partial<{
    name: string;
    description: string;
    isEnabled: boolean;
    percentage: number;
    targetUsers: string[];
    targetRoles: string[];
    conditions: Record<string, unknown>;
  }>
) {
  return prisma.featureFlag.update({
    where: { key },
    data: updates,
  });
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(key: string) {
  return prisma.featureFlag.delete({
    where: { key },
  });
}

/**
 * Toggle a feature flag
 */
export async function toggleFeatureFlag(key: string) {
  const flag = await getFeatureFlag(key);
  if (!flag) {
    throw new Error('Feature flag not found');
  }
  
  return prisma.featureFlag.update({
    where: { key },
    data: { isEnabled: !flag.isEnabled },
  });
}

/**
 * Set rollout percentage
 */
export async function setRolloutPercentage(key: string, percentage: number) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  return prisma.featureFlag.update({
    where: { key },
    data: { percentage },
  });
}

/**
 * Add target users to a feature flag
 */
export async function addTargetUsers(key: string, userIds: string[]) {
  const flag = await getFeatureFlag(key);
  if (!flag) {
    throw new Error('Feature flag not found');
  }

  const uniqueUsers = [...new Set([...flag.targetUsers, ...userIds])];

  return prisma.featureFlag.update({
    where: { key },
    data: { targetUsers: uniqueUsers },
  });
}

/**
 * Remove target users from a feature flag
 */
export async function removeTargetUsers(key: string, userIds: string[]) {
  const flag = await getFeatureFlag(key);
  if (!flag) {
    throw new Error('Feature flag not found');
  }

  const filteredUsers = flag.targetUsers.filter((u) => !userIds.includes(u));

  return prisma.featureFlag.update({
    where: { key },
    data: { targetUsers: filteredUsers },
  });
}

/**
 * Get feature flags for a user (returns which flags are enabled)
 */
export async function getUserFeatureFlags(context: FeatureFlagContext) {
  const allFlags = await getAllFeatureFlags();
  const result: Record<string, boolean> = {};

  for (const flag of allFlags) {
    result[flag.key] = await isFeatureEnabled(flag.key, context);
  }

  return result;
}

/**
 * Record deployment
 */
export async function recordDeployment(data: {
  version: string;
  environment: 'staging' | 'production';
  commitHash?: string;
  commitMessage?: string;
  deployedBy?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.deploymentRecord.create({
    data: {
      version: data.version,
      environment: data.environment,
      status: 'deploying',
      commitHash: data.commitHash,
      commitMessage: data.commitMessage,
      deployedBy: data.deployedBy,
      metadata: data.metadata,
    },
  });
}

/**
 * Update deployment status
 */
export async function updateDeploymentStatus(
  id: string,
  status: 'deployed' | 'failed' | 'rolled_back',
  details?: {
    smokeTestPassed?: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return prisma.deploymentRecord.update({
    where: { id },
    data: {
      status,
      completedAt: new Date(),
      smokeTestPassed: details?.smokeTestPassed,
      errorMessage: details?.errorMessage,
      metadata: details?.metadata,
    },
  });
}

/**
 * Get deployment history
 */
export async function getDeploymentHistory(
  environment?: string,
  limit: number = 50
) {
  return prisma.deploymentRecord.findMany({
    where: environment ? { environment } : undefined,
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}

/**
 * Get latest deployment for environment
 */
export async function getLatestDeployment(environment: string) {
  return prisma.deploymentRecord.findFirst({
    where: {
      environment,
      status: 'deployed',
    },
    orderBy: { completedAt: 'desc' },
  });
}

/**
 * Mark deployment for rollback
 */
export async function initiateRollback(deploymentId: string) {
  const deployment = await prisma.deploymentRecord.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment) {
    throw new Error('Deployment not found');
  }

  return prisma.deploymentRecord.update({
    where: { id: deploymentId },
    data: {
      status: 'rolled_back',
    },
  });
}
