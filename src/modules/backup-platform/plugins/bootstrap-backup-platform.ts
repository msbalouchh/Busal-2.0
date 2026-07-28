import { DEFAULT_ENCRYPTION_KEY_ID } from "@/modules/backup-platform/constants/routes";
import { registerBackupPolicyDefinition } from "@/modules/backup-platform/registry/backup-policy-registry";
import type { RegisteredBackupPolicyDefinition } from "@/modules/backup-platform/types/backup-platform-types";

const DEFAULT_POLICIES: Omit<RegisteredBackupPolicyDefinition, "isActive">[] = [
  {
    policyKey: "database.primary",
    name: "Primary Database Backup",
    module: "database",
    scope: "DATABASE",
    scheduleCron: "0 2 * * *",
    retentionDays: 30,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
  {
    policyKey: "files.platform",
    name: "File Platform Backup",
    module: "file-platform",
    scope: "FILE",
    scheduleCron: "0 3 * * *",
    retentionDays: 30,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
  {
    policyKey: "configuration.settings",
    name: "Configuration Backup",
    module: "settings-engine",
    scope: "CONFIGURATION",
    scheduleCron: "0 4 * * *",
    retentionDays: 60,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
  {
    policyKey: "tenant.full",
    name: "Full Tenant Backup",
    module: "platform",
    scope: "TENANT",
    scheduleCron: "0 1 * * 0",
    retentionDays: 90,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
  {
    policyKey: "business.data",
    name: "Business Data Backup",
    module: "business",
    scope: "BUSINESS",
    scheduleCron: "0 2 * * *",
    retentionDays: 30,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
  {
    policyKey: "branch.data",
    name: "Branch Data Backup",
    module: "branches",
    scope: "BRANCH",
    scheduleCron: "0 3 * * *",
    retentionDays: 30,
    encryptionKeyId: DEFAULT_ENCRYPTION_KEY_ID,
  },
];

let bootstrapped = false;

export function ensureBootstrapBackupPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const policy of DEFAULT_POLICIES) {
    registerBackupPolicyDefinition({ ...policy, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapBackupPlatform(): void {
  bootstrapped = false;
}

export function getDefaultPolicyCount(): number {
  return DEFAULT_POLICIES.length;
}

export const DEFAULT_REGISTERED_POLICIES = DEFAULT_POLICIES;
