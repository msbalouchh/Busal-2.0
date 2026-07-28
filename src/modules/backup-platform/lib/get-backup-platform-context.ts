import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeBackupAuditLog,
  serializeBackupPlatformDashboard,
  serializeBackupPolicy,
  serializeBackupRecord,
  serializeDisasterRecoveryPlan,
  serializeRecoveryJob,
  serializeRetentionPolicy,
} from "@/modules/backup-platform/utils/backup-platform-utils";
import {
  ensureBackupPlatformDefaults,
  getBackupPlatformDashboard,
  listBackupPlatformAuditLogs,
  listBackupPolicies,
  listBackupRecords,
  listBackupRetentionPolicies,
  listDisasterRecoveryPlans,
  listRecoveryJobs,
  listRegisteredBackupPolicies,
  logBackupDashboardAccess,
} from "@/services/backup-platform.service";

export const getBackupPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  await ensureBackupPlatformDefaults(context.business.id);
  await logBackupDashboardAccess(context, "overview");
  const dashboard = await getBackupPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeBackupPlatformDashboard(dashboard),
  };
});

export const getBackupPlatformBackupsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const backups = await listBackupRecords(context.business.id);

  return {
    context,
    backups: backups.map(serializeBackupRecord),
  };
});

export const getBackupPlatformRecoveryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const jobs = await listRecoveryJobs(context.business.id);

  return {
    context,
    jobs: jobs.map(serializeRecoveryJob),
  };
});

export const getBackupPlatformPlansContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const plans = await listDisasterRecoveryPlans(context.business.id);

  return {
    context,
    plans: plans.map(serializeDisasterRecoveryPlan),
  };
});

export const getBackupPlatformRetentionContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const policies = await listBackupRetentionPolicies(context.business.id);

  return {
    context,
    policies: policies.map(serializeRetentionPolicy),
  };
});

export const getBackupPlatformMonitoringContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const dashboard = await getBackupPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeBackupPlatformDashboard(dashboard),
  };
});

export const getBackupPlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const [registrations, policies] = await Promise.all([
    listRegisteredBackupPolicies(),
    listBackupPolicies(context.business.id),
  ]);

  return {
    context,
    registrations,
    policies: policies.map(serializeBackupPolicy),
  };
});

export const getBackupPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.BACKUP_PLATFORM_VIEW });
  const auditLogs = await listBackupPlatformAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeBackupAuditLog),
  };
});
