import { createHash } from "node:crypto";

export function generateBackupChecksum(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function verifyBackupIntegrity(storedChecksum: string, payload: string): boolean {
  return generateBackupChecksum(payload) === storedChecksum;
}

export function resolveEncryptionKeyId(keyId?: string | null): string {
  return keyId ?? "busal-backup-key-v1";
}

export function encryptBackupMetadata(
  metadata: Record<string, unknown>,
  keyId: string,
): Record<string, unknown> {
  return {
    ...metadata,
    encrypted: true,
    encryptionKeyId: keyId,
  };
}
