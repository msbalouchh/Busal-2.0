import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function getEncryptionKey(): Buffer {
  const raw =
    process.env.DEVELOPER_API_SECRET_KEY ??
    "busal-dev-developer-api-secret-key-change-in-production";
  return createHash("sha256").update(raw).digest();
}

export function encryptDeveloperSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptDeveloperSecret(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted secret format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateClientId(): string {
  return `busal_${randomBytes(12).toString("hex")}`;
}

export function generateClientSecret(): string {
  return `sec_${randomBytes(24).toString("hex")}`;
}

export function generateApiKeyValue(): string {
  return `bk_${randomBytes(32).toString("hex")}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function maskSecret(value: string): string {
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 4)}${"•".repeat(8)}${value.slice(-4)}`;
}

export const DEFAULT_RATE_LIMIT_PER_MINUTE = 120;
