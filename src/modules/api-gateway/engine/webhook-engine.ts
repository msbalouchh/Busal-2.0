import { createHmac, timingSafeEqual } from "node:crypto";

import type { WebhookRetryPolicy } from "@/modules/api-gateway/types/api-gateway-types";

export function verifyWebhookSecret(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function resolveNextRetry(attemptCount: number, policy: WebhookRetryPolicy): Date | null {
  if (attemptCount >= policy.maxAttempts) {
    return null;
  }

  const delayMs = policy.backoffMs * Math.pow(2, attemptCount);
  return new Date(Date.now() + delayMs);
}

export function shouldMoveToDeadLetter(attemptCount: number, policy: WebhookRetryPolicy): boolean {
  return attemptCount >= policy.maxAttempts;
}

export const DEFAULT_WEBHOOK_RETRY_POLICY: WebhookRetryPolicy = {
  maxAttempts: 5,
  backoffMs: 1000,
};
