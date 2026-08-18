import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { verifyWebhookSignature } from "@/services/integration-webhook-crypto.service";

export function verifyMetaWebhookSignature(
  rawBody: string,
  appSecret: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export function verifyTwilioWebhookSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(sorted).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export function verifyTikTokWebhookSignature(
  rawBody: string,
  secret: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  return verifyWebhookSignature(rawBody, secret, signatureHeader.replace(/^sha256=/, ""));
}

export function parseMetaWebhookChallenge(searchParams: URLSearchParams): {
  mode: string | null;
  token: string | null;
  challenge: string | null;
} {
  return {
    mode: searchParams.get("hub.mode"),
    token: searchParams.get("hub.verify_token"),
    challenge: searchParams.get("hub.challenge"),
  };
}
