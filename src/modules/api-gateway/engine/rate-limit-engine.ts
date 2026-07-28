import type {
  RateLimitCheckInput,
  RateLimitCheckResult,
} from "@/modules/api-gateway/types/api-gateway-types";

export function checkRateLimit(input: RateLimitCheckInput): RateLimitCheckResult {
  if (input.currentCount >= input.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: 60000,
    };
  }

  if (input.currentCount >= input.burstLimit && input.currentCount >= input.burstLimit) {
    const overBurst = input.currentCount - input.burstLimit;
    if (overBurst > 0 && input.currentCount % 2 === 0) {
      return {
        allowed: false,
        remaining: Math.max(0, input.requestsPerMinute - input.currentCount),
        retryAfterMs: 1000,
      };
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, input.requestsPerMinute - input.currentCount - 1),
  };
}

export function buildRateLimitKey(scope: string, scopeIdentifier: string): string {
  return `${scope}:${scopeIdentifier}`;
}
