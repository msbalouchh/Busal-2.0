import "server-only";

import { DEFAULT_RATE_LIMIT_PER_MINUTE } from "@/services/developer-platform-context.service";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_RATE_LIMIT_PER_MINUTE,
): RateLimitResult {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + 60_000;
    requestBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);
  return { allowed: true, limit, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function resetRateLimit(key: string): void {
  requestBuckets.delete(key);
}

export interface IpAllowListResult {
  allowed: boolean;
  simulated: boolean;
}

export function checkIpAllowList(ipAddress: string, allowList: string[]): IpAllowListResult {
  if (allowList.length === 0) return { allowed: true, simulated: true };
  return { allowed: allowList.includes(ipAddress), simulated: true };
}
