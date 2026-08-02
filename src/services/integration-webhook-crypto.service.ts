import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function hashWebhookSecret(secret: string): string {
  return createHmac("sha256", "busal-webhook-secret").update(secret).digest("hex");
}

export function verifyWebhookSignature(
  payload: string,
  secret: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
