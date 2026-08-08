import { getNextRetryAt as getWebhookRetryAt } from "@/modules/integrations/utils/integration-webhook-utils";

export function computeNextRetryAt(attemptCount: number, baseDelayMs = 2000): string {
  return getWebhookRetryAt(attemptCount, baseDelayMs);
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 2000,
};

export function shouldRetry(attemptCount: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): boolean {
  return attemptCount < policy.maxAttempts;
}
