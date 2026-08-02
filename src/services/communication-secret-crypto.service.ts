import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const DEV_FALLBACK_KEY = "busal-communication-dev-key-change-in-production";

function getEncryptionKey(): Buffer {
  const raw = process.env.COMMUNICATION_SECRETS_KEY ?? DEV_FALLBACK_KEY;
  return createHash("sha256").update(raw).digest();
}

export function encryptCommunicationSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCommunicationSecret(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Invalid encrypted secret format");
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskCommunicationSecret(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.min(value.length - 4, 8))}${value.slice(-2)}`;
}
