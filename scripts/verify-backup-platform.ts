import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import {
  generateBackupChecksum,
  verifyBackupIntegrity,
} from "../src/modules/backup-platform/engine/encryption-engine";
import {
  buildRestorePreviewData,
  calculateRecoveryProgress,
  resolveRecoveryJobSteps,
} from "../src/modules/backup-platform/engine/recovery-engine";
import { resolveRetentionCutoff } from "../src/modules/backup-platform/engine/retention-engine";
import {
  BACKUP_PLATFORM_ROUTES,
  BACKUP_SCOPES,
  BACKUP_TRIGGER_TYPES,
  RECOVERY_JOB_TYPES,
} from "../src/modules/backup-platform/constants/routes";
import {
  ensureBootstrapBackupPlatform,
  getDefaultPolicyCount,
} from "../src/modules/backup-platform/plugins/bootstrap-backup-platform";
import {
  isBackupPolicyRegistered,
  listBackupPolicyDefinitions,
} from "../src/modules/backup-platform/registry/backup-policy-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  applyBackupRetentionPolicies,
  createBackup,
  ensureBackupPlatformDefaults,
  getBackupPlatformDashboard,
  listBackupPlatformAuditLogs,
  logBackupDashboardAccess,
  registerModuleBackupPolicy,
  startRecoveryJob,
  upsertDisasterRecoveryPlan,
  upsertBackupRetentionPolicy,
  verifyBackupRecord,
} from "../src/services/backup-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/backup-platform/index.ts",
    "src/modules/backup-platform/constants/routes.ts",
    "src/modules/backup-platform/types/backup-platform-types.ts",
    "src/modules/backup-platform/registry/backup-policy-registry.ts",
    "src/modules/backup-platform/engine/encryption-engine.ts",
    "src/modules/backup-platform/engine/recovery-engine.ts",
    "src/modules/backup-platform/engine/retention-engine.ts",
    "src/modules/backup-platform/plugins/bootstrap-backup-platform.ts",
    "src/modules/backup-platform/utils/backup-platform-utils.ts",
    "src/modules/backup-platform/lib/get-backup-platform-context.ts",
    "src/modules/backup-platform/actions/backup-platform-actions.ts",
    "src/modules/backup-platform/components/backup-platform-dashboard.tsx",
    "src/modules/backup-platform/components/backup-platform-lists.tsx",
    "src/modules/backup-platform/components/backup-platform-nav.tsx",
    "src/services/backup-platform.service.ts",
    "src/app/dashboard/backup-platform/page.tsx",
    "src/app/dashboard/backup-platform/backups/page.tsx",
    "src/app/dashboard/backup-platform/recovery/page.tsx",
    "src/app/dashboard/backup-platform/plans/page.tsx",
    "src/app/dashboard/backup-platform/retention/page.tsx",
    "src/app/dashboard/backup-platform/monitoring/page.tsx",
    "src/app/dashboard/backup-platform/registry/page.tsx",
    "src/app/dashboard/backup-platform/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Backup platform routes");
  assert(
    BACKUP_PLATFORM_ROUTES.overview === "/dashboard/backup-platform",
    "Overview route mismatch",
  );
  assert(BACKUP_PLATFORM_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("backup_platform.view"), "backup_platform.view missing");
  assert(permissionsSource.includes("backup_platform.admin"), "backup_platform.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model BackupPolicy"), "BackupPolicy missing");
  assert(schema.includes("model BackupRecord"), "BackupRecord missing");
  assert(schema.includes("model RecoveryJob"), "RecoveryJob missing");
  assert(schema.includes("model DisasterRecoveryPlan"), "DisasterRecoveryPlan missing");
  assert(schema.includes("model BackupPlatformAuditLog"), "BackupPlatformAuditLog missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapBackupPlatform();
  const policies = listBackupPolicyDefinitions();
  assert(policies.length === getDefaultPolicyCount(), "Default policies not registered");
  assert(isBackupPolicyRegistered("database.primary"), "Database policy missing");
  assert(isBackupPolicyRegistered("files.platform"), "File policy missing");
  assert(BACKUP_SCOPES.length === 6, "Expected 6 backup scopes");
  assert(BACKUP_TRIGGER_TYPES.length === 2, "Expected 2 trigger types");
  assert(RECOVERY_JOB_TYPES.length === 5, "Expected 5 recovery job types");
  console.log("  PASS");

  console.log("Encryption engine");
  const checksum = generateBackupChecksum("test-payload");
  assert(verifyBackupIntegrity(checksum, "test-payload"), "Integrity verification failed");
  assert(!verifyBackupIntegrity(checksum, "tampered"), "Tampered payload should fail");
  console.log("  PASS");

  console.log("Recovery engine");
  assert(calculateRecoveryProgress(2, 4) === 50, "Recovery progress failed");
  assert(resolveRecoveryJobSteps("PITR") === 5, "PITR steps failed");
  const preview = buildRestorePreviewData({
    backupKey: "test-backup",
    scope: "BUSINESS",
    recordCount: 50,
  });
  assert(preview.safeToRestore === true, "Restore preview failed");
  console.log("  PASS");

  console.log("Retention engine");
  assert(resolveRetentionCutoff(30) < new Date(), "Retention cutoff failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.recoveryJob.deleteMany({ where: { businessId: business.id } });
  await prisma.backupPolicy.deleteMany({
    where: { businessId: business.id, policyKey: { startsWith: "custom.verify" } },
  });
  await prisma.backupRetentionPolicy.deleteMany({
    where: { businessId: business.id, name: { startsWith: "custom.verify" } },
  });
  await prisma.disasterRecoveryPlan.deleteMany({
    where: { businessId: business.id, name: { startsWith: "custom.verify" } },
  });

  console.log("Backup platform defaults");
  await ensureBackupPlatformDefaults(business.id);
  const policyCount = await prisma.backupPolicy.count({ where: { businessId: business.id } });
  assert(policyCount >= getDefaultPolicyCount(), "Default policies not seeded");
  const planCount = await prisma.disasterRecoveryPlan.count({ where: { businessId: business.id } });
  assert(planCount >= 1, "Default DR plan missing");
  console.log("  PASS");

  console.log("Create manual backup");
  const manual = await createBackup(platform, {
    policyKey: "database.primary",
    triggerType: "MANUAL",
    scope: "DATABASE",
    sizeBytes: 4096,
  });
  assert(manual.id, "Manual backup not created");
  console.log("  PASS");

  console.log("Create automated backup");
  const automated = await createBackup(platform, {
    policyKey: "business.data",
    triggerType: "AUTOMATED",
    scope: "BUSINESS",
  });
  assert(automated.id, "Automated backup not created");
  console.log("  PASS");

  console.log("Verify backup integrity");
  const verification = await verifyBackupRecord(platform, manual.id);
  assert(verification.verified, "Backup integrity verification failed");
  console.log("  PASS");

  console.log("Point-in-time recovery backup");
  const pitr = await createBackup(platform, {
    policyKey: "database.primary",
    triggerType: "MANUAL",
    scope: "DATABASE",
    pitrTimestamp: new Date("2026-07-28T10:00:00.000Z"),
  });
  assert(pitr.id, "PITR backup not created");
  console.log("  PASS");

  console.log("Branch restore backup");
  const branchBackup = await createBackup(platform, {
    policyKey: "branch.data",
    triggerType: "MANUAL",
    scope: "BRANCH",
    branchId: "branch-verify-1",
  });
  assert(branchBackup.id, "Branch backup not created");
  console.log("  PASS");

  console.log("Start recovery job");
  const recovery = await startRecoveryJob(platform, {
    backupId: manual.id,
    jobType: "BUSINESS_RESTORE",
  });
  assert(recovery.progressPct === 100, "Recovery job should complete");
  console.log("  PASS");

  console.log("Restore preview job");
  const previewJob = await startRecoveryJob(platform, {
    backupId: manual.id,
    jobType: "PREVIEW",
  });
  assert(previewJob.id, "Preview job failed");
  console.log("  PASS");

  console.log("PITR recovery job");
  const pitrJob = await startRecoveryJob(platform, {
    backupId: pitr.id,
    jobType: "PITR",
    pitrTimestamp: new Date("2026-07-28T10:00:00.000Z"),
  });
  assert(pitrJob.id, "PITR recovery failed");
  console.log("  PASS");

  console.log("Tenant restore job");
  const tenantJob = await startRecoveryJob(platform, {
    backupId: automated.id,
    jobType: "TENANT_RESTORE",
  });
  assert(tenantJob.id, "Tenant restore failed");
  console.log("  PASS");

  console.log("Branch restore job");
  const branchJob = await startRecoveryJob(platform, {
    backupId: branchBackup.id,
    jobType: "BRANCH_RESTORE",
    branchId: "branch-verify-1",
  });
  assert(branchJob.id, "Branch restore failed");
  console.log("  PASS");

  console.log("Upsert DR plan");
  const plan = await upsertDisasterRecoveryPlan(platform, {
    name: "custom.verify_dr_plan",
    description: "Verify DR plan",
    rtoMinutes: 30,
    rpoMinutes: 10,
  });
  assert(plan.id, "DR plan not created");
  console.log("  PASS");

  console.log("Upsert retention policy");
  const retention = await upsertBackupRetentionPolicy(platform, {
    name: "custom.verify_retention",
    retentionDays: 14,
    archiveEnabled: true,
  });
  assert(retention.id, "Retention policy not created");
  console.log("  PASS");

  console.log("Register module backup policy");
  await registerModuleBackupPolicy(business.id, {
    policyKey: "custom.verify_ext",
    name: "Verify Extension Backup",
    module: "verify-module",
    scope: "CONFIGURATION",
    isActive: true,
  });
  assert(isBackupPolicyRegistered("custom.verify_ext"), "Custom policy registration failed");
  console.log("  PASS");

  console.log("Apply retention policies");
  const applied = await applyBackupRetentionPolicies(business.id);
  assert(applied.removed >= 0, "Retention apply failed");
  console.log("  PASS");

  console.log("Backup platform dashboard");
  const dashboard = await getBackupPlatformDashboard(business.id);
  assert(dashboard.totalBackups >= 4, "Dashboard total backups missing");
  assert(
    dashboard.registeredPolicies >= getDefaultPolicyCount() + 1,
    "Registered policies mismatch",
  );
  console.log("  PASS");

  console.log("Dashboard access audit");
  await logBackupDashboardAccess(platform, "overview");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listBackupPlatformAuditLogs(business.id);
  assert(
    auditLogs.some((entry) => entry.eventType === "BACKUP_CREATED"),
    "Backup created audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "BACKUP_VERIFIED"),
    "Backup verified audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "RECOVERY_STARTED"),
    "Recovery started audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "RECOVERY_COMPLETED"),
    "Recovery completed audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "POLICY_REGISTERED"),
    "Policy registered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DR_PLAN_UPDATED"),
    "DR plan updated audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "NOTIFICATION_SENT"),
    "Notification sent audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DASHBOARD_ACCESS"),
    "Dashboard access audit missing",
  );
  console.log("  PASS");

  console.log("\nBackup & Disaster Recovery Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
