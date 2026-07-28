import { createHash, randomBytes } from "node:crypto";

export function generateApiKeyRaw(prefix: string): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secret = randomBytes(24).toString("hex");
  const rawKey = `${prefix}_${secret}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = hashApiKey(rawKey);

  return { rawKey, keyPrefix, keyHash };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => randomBytes(4).toString("hex"));
}

export function generateTotpSecret(): string {
  return randomBytes(20).toString("base64url");
}
