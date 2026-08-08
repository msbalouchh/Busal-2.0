import "server-only";

import { randomUUID } from "crypto";

import type { IamAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import {
  CONTROL_CENTER_OPERATOR_PAGE_SIZE,
  OPERATOR_ROLE_PERMISSIONS,
} from "@/modules/control-center/operators/constants/control-center-operators";
import {
  filterAndSortOperators,
  findOperatorRecordById,
  loadAllOperatorRecordsIncludingDeleted,
  loadOperatorRegistry,
  loadOperatorUserMetrics,
  paginateOperators,
  saveOperatorRegistry,
  type StoredPlatformOperatorRecord,
} from "@/modules/control-center/operators/repository/control-center-operator.repository";
import type {
  AssignControlCenterOperatorRoleInput,
  ControlCenterOperatorBulkActionInput,
  ControlCenterOperatorBulkActionResult,
  ControlCenterOperatorDetailBundle,
  ControlCenterOperatorDirectoryItem,
  ControlCenterOperatorDirectoryQuery,
  ControlCenterOperatorDirectoryResult,
  ControlCenterOperatorManagementBundle,
  ControlCenterOperatorPermissions,
  ControlCenterOperatorProfile,
  ControlCenterOperatorStatistics,
  CreateControlCenterOperatorInput,
  ManageControlCenterOperatorPermissionsInput,
  PlatformOperatorRole,
  UpdateControlCenterOperatorInput,
} from "@/modules/control-center/operators/types/control-center-operators-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { requestPasswordReset } from "@/services/auth.service";

async function logOperatorAudit(
  actor: ControlCenterOperatorContext,
  eventType: IamAuditEventType,
  metadata: Record<string, unknown>,
  targetUserId?: string,
): Promise<void> {
  await prisma.iamSecurityAuditLog.create({
    data: {
      businessId: null,
      userId: targetUserId ?? actor.userId,
      eventType,
      metadata: {
        ...metadata,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        operatorManagement: true,
      } as Prisma.InputJsonValue,
    },
  });
}

async function resolveActorRecord(
  actor: ControlCenterOperatorContext,
): Promise<StoredPlatformOperatorRecord | null> {
  const registry = await loadOperatorRegistry();
  return registry.find((entry) => entry.userId === actor.userId) ?? null;
}

function isLegacyPlatformOwner(actor: ControlCenterOperatorContext, registry: StoredPlatformOperatorRecord[]): boolean {
  if (registry.some((entry) => entry.role === "PLATFORM_OWNER")) {
    return false;
  }
  return getControlCenterOperatorEmails().includes(actor.email.trim().toLowerCase());
}

async function resolveIsPlatformOwner(actor: ControlCenterOperatorContext): Promise<boolean> {
  const registry = await loadOperatorRegistry();
  const record = registry.find((entry) => entry.userId === actor.userId);
  if (record?.role === "PLATFORM_OWNER") return true;
  return isLegacyPlatformOwner(actor, registry);
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
  isPlatformOwner: boolean,
): ControlCenterOperatorPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canCreate: isPlatformOwner,
    canEdit:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT),
    canDelete: isPlatformOwner,
    canSuspend:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_SUSPEND),
    canActivate:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT),
    canResetPassword:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT),
    canForceLogout:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_EDIT),
    canAssignRole:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_ROLES),
    canManagePermissions:
      isPlatformOwner ||
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_OPERATORS_PERMISSIONS),
    canExport: canView,
    isPlatformOwner,
  };
}

function mapDirectoryItem(
  record: StoredPlatformOperatorRecord,
  metrics: Awaited<ReturnType<typeof loadOperatorUserMetrics>>,
): ControlCenterOperatorDirectoryItem {
  const mfa = metrics.mfaByUser.get(record.userId);
  return {
    id: record.id,
    userId: record.userId,
    fullName: record.fullName,
    email: record.email,
    role: record.role,
    status: record.status,
    department: record.department,
    lastLoginAt: metrics.lastLoginByUser.get(record.userId)?.toISOString() ?? null,
    mfaEnabled: mfa?.enabled ?? false,
    activeSessions: metrics.sessionsByUser.get(record.userId) ?? 0,
    permissionCount: record.permissions.length,
    createdAt: record.createdAt,
  };
}

async function buildStatistics(
  records: StoredPlatformOperatorRecord[],
  metrics: Awaited<ReturnType<typeof loadOperatorUserMetrics>>,
): Promise<ControlCenterOperatorStatistics> {
  const activeSessions = [...metrics.sessionsByUser.values()].reduce((sum, count) => sum + count, 0);

  return {
    totalOperators: records.length,
    activeOperators: records.filter((entry) => entry.status === "active").length,
    suspendedOperators: records.filter((entry) => entry.status === "suspended").length,
    mfaEnabledOperators: records.filter((entry) => metrics.mfaByUser.get(entry.userId)?.enabled).length,
    activeSessions,
    platformOwners: records.filter((entry) => entry.role === "PLATFORM_OWNER").length,
  };
}

export async function queryControlCenterOperatorDirectory(
  query: ControlCenterOperatorDirectoryQuery = {},
): Promise<ControlCenterOperatorDirectoryResult> {
  const records = await loadOperatorRegistry();
  const userIds = records.map((entry) => entry.userId);
  const metrics = await loadOperatorUserMetrics(userIds);
  const filtered = filterAndSortOperators(records, query, metrics);
  const paged = paginateOperators(filtered, query);
  const statistics = await buildStatistics(records, metrics);

  return {
    items: paged.items.map((record) => mapDirectoryItem(record, metrics)),
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    totalPages: paged.totalPages,
    statistics,
  };
}

async function buildOperatorProfile(record: StoredPlatformOperatorRecord): Promise<ControlCenterOperatorProfile> {
  const metrics = await loadOperatorUserMetrics([record.userId]);
  const mfa = metrics.mfaByUser.get(record.userId);

  const [sessions, auditLogs] = await Promise.all([
    prisma.iamSession.findMany({
      where: { userId: record.userId },
      orderBy: { lastActivityAt: "desc" },
      take: 20,
    }),
    prisma.iamSecurityAuditLog.findMany({
      where: { userId: record.userId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activities = auditLogs.slice(0, 20).map((log) => ({
    id: log.id,
    eventType: log.eventType,
    title: log.eventType.replace(/_/g, " "),
    description: typeof log.metadata === "object" && log.metadata && "action" in log.metadata
      ? String((log.metadata as Record<string, unknown>).action)
      : "Operator activity recorded",
    createdAt: log.createdAt.toISOString(),
    actorEmail: log.user?.email ?? null,
  }));

  return {
    id: record.id,
    userId: record.userId,
    fullName: record.fullName,
    email: record.email,
    role: record.role,
    status: record.status,
    department: record.department,
    permissions: record.permissions,
    lastLoginAt: metrics.lastLoginByUser.get(record.userId)?.toISOString() ?? null,
    mfaEnabled: mfa?.enabled ?? false,
    mfaTypes: mfa?.types ?? [],
    activeSessions: metrics.sessionsByUser.get(record.userId) ?? 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    sessions: sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      browser: session.browser,
      ipAddress: session.ipAddress,
      loginAt: session.loginAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      isActive: session.isActive && !session.revokedAt,
    })),
    activities,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      actorEmail: log.user?.email ?? null,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function getControlCenterOperatorManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterOperatorDirectoryQuery = {},
): Promise<ControlCenterOperatorManagementBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const directory = await queryControlCenterOperatorDirectory(query);
  return { directory, permissions };
}

export async function getControlCenterOperatorDetailBundle(
  operator: ControlCenterOperatorContext,
  operatorId: string,
): Promise<ControlCenterOperatorDetailBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const record = await findOperatorRecordById(operatorId);
  if (!record) {
    throw new Error("Operator not found");
  }

  const profile = await buildOperatorProfile(record);
  return { profile, permissions };
}

function assertCanModifyPlatformOwnerRole(
  actorPermissions: ControlCenterOperatorPermissions,
  nextRole: PlatformOperatorRole,
  currentRole: PlatformOperatorRole,
): void {
  if (
    (nextRole === "PLATFORM_OWNER" || currentRole === "PLATFORM_OWNER") &&
    !actorPermissions.isPlatformOwner
  ) {
    throw new Error("Only Platform Owner can change Platform Owner role");
  }
}

export async function createControlCenterOperator(
  actor: ControlCenterOperatorContext,
  input: CreateControlCenterOperatorInput,
): Promise<ControlCenterOperatorProfile> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canCreate) {
    throw new Error("Permission denied");
  }

  assertCanModifyPlatformOwnerRole(permissions, input.role, "READ_ONLY");

  const email = input.email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        fullName: input.fullName.trim(),
        role: "owner",
      },
    });
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  if (allRecords.some((entry) => entry.userId === user!.id && !entry.deletedAt)) {
    throw new Error("Operator already exists for this user");
  }

  const now = new Date().toISOString();
  const record: StoredPlatformOperatorRecord = {
    id: randomUUID(),
    userId: user.id,
    email: user.email,
    fullName: input.fullName.trim() || user.fullName,
    role: input.role,
    status: "active",
    department: input.department?.trim() || null,
    permissions: input.permissions?.length
      ? input.permissions
      : OPERATOR_ROLE_PERMISSIONS[input.role],
    createdAt: now,
    updatedAt: now,
    createdById: actor.userId,
    deletedAt: null,
  };

  await saveOperatorRegistry([...allRecords, record]);

  await logOperatorAudit(actor, "PERMISSION_CHANGED", {
    action: "operator_created",
    targetOperatorId: record.id,
    role: record.role,
    email: record.email,
  }, user.id);

  return buildOperatorProfile(record);
}

export async function updateControlCenterOperator(
  actor: ControlCenterOperatorContext,
  input: UpdateControlCenterOperatorInput,
): Promise<ControlCenterOperatorProfile> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canEdit) {
    throw new Error("Permission denied");
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  const index = allRecords.findIndex((entry) => entry.id === input.operatorId && !entry.deletedAt);
  if (index < 0) {
    throw new Error("Operator not found");
  }

  const current = allRecords[index]!;
  const updated: StoredPlatformOperatorRecord = {
    ...current,
    fullName: input.fullName?.trim() ?? current.fullName,
    department: input.department !== undefined ? input.department?.trim() || null : current.department,
    updatedAt: new Date().toISOString(),
  };

  allRecords[index] = updated;
  await saveOperatorRegistry(allRecords);

  if (input.fullName) {
    await prisma.user.update({
      where: { id: current.userId },
      data: { fullName: updated.fullName },
    });
  }

  await logOperatorAudit(actor, "PERMISSION_CHANGED", {
    action: "operator_updated",
    targetOperatorId: current.id,
  }, current.userId);

  return buildOperatorProfile(updated);
}

export async function assignControlCenterOperatorRole(
  actor: ControlCenterOperatorContext,
  input: AssignControlCenterOperatorRoleInput,
): Promise<ControlCenterOperatorProfile> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canAssignRole) {
    throw new Error("Permission denied");
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  const index = allRecords.findIndex((entry) => entry.id === input.operatorId && !entry.deletedAt);
  if (index < 0) {
    throw new Error("Operator not found");
  }

  const current = allRecords[index]!;
  assertCanModifyPlatformOwnerRole(permissions, input.role, current.role);

  const updated: StoredPlatformOperatorRecord = {
    ...current,
    role: input.role,
    permissions: OPERATOR_ROLE_PERMISSIONS[input.role],
    updatedAt: new Date().toISOString(),
  };

  allRecords[index] = updated;
  await saveOperatorRegistry(allRecords);

  await logOperatorAudit(actor, "PERMISSION_CHANGED", {
    action: "operator_role_assigned",
    targetOperatorId: current.id,
    previousRole: current.role,
    nextRole: input.role,
  }, current.userId);

  return buildOperatorProfile(updated);
}

export async function manageControlCenterOperatorPermissions(
  actor: ControlCenterOperatorContext,
  input: ManageControlCenterOperatorPermissionsInput,
): Promise<ControlCenterOperatorProfile> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canManagePermissions) {
    throw new Error("Permission denied");
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  const index = allRecords.findIndex((entry) => entry.id === input.operatorId && !entry.deletedAt);
  if (index < 0) {
    throw new Error("Operator not found");
  }

  const current = allRecords[index]!;

  const updated: StoredPlatformOperatorRecord = {
    ...current,
    permissions: [...new Set(input.permissions)],
    updatedAt: new Date().toISOString(),
  };

  allRecords[index] = updated;
  await saveOperatorRegistry(allRecords);

  await logOperatorAudit(actor, "PERMISSION_CHANGED", {
    action: "operator_permissions_updated",
    targetOperatorId: current.id,
    permissionCount: updated.permissions.length,
  }, current.userId);

  return buildOperatorProfile(updated);
}

async function setOperatorStatus(
  actor: ControlCenterOperatorContext,
  operatorId: string,
  status: "active" | "suspended",
): Promise<ControlCenterOperatorProfile> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (status === "suspended" && !permissions.canSuspend) {
    throw new Error("Permission denied");
  }
  if (status === "active" && !permissions.canActivate) {
    throw new Error("Permission denied");
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  const index = allRecords.findIndex((entry) => entry.id === operatorId && !entry.deletedAt);
  if (index < 0) {
    throw new Error("Operator not found");
  }

  const current = allRecords[index]!;
  if (current.role === "PLATFORM_OWNER" && status === "suspended") {
    throw new Error("Cannot suspend Platform Owner");
  }

  const updated: StoredPlatformOperatorRecord = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  };

  allRecords[index] = updated;
  await saveOperatorRegistry(allRecords);

  await logOperatorAudit(
    actor,
    status === "suspended" ? "ACCOUNT_LOCKED" : "ACCOUNT_UNLOCKED",
    { action: status === "suspended" ? "operator_suspended" : "operator_activated", targetOperatorId: current.id },
    current.userId,
  );

  return buildOperatorProfile(updated);
}

export async function suspendControlCenterOperator(
  actor: ControlCenterOperatorContext,
  operatorId: string,
): Promise<ControlCenterOperatorProfile> {
  return setOperatorStatus(actor, operatorId, "suspended");
}

export async function activateControlCenterOperator(
  actor: ControlCenterOperatorContext,
  operatorId: string,
): Promise<ControlCenterOperatorProfile> {
  return setOperatorStatus(actor, operatorId, "active");
}

export async function deleteControlCenterOperator(
  actor: ControlCenterOperatorContext,
  operatorId: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canDelete) {
    throw new Error("Permission denied");
  }

  const allRecords = await loadAllOperatorRecordsIncludingDeleted();
  const index = allRecords.findIndex((entry) => entry.id === operatorId && !entry.deletedAt);
  if (index < 0) {
    throw new Error("Operator not found");
  }

  const current = allRecords[index]!;
  if (current.role === "PLATFORM_OWNER") {
    throw new Error("Cannot delete Platform Owner");
  }
  if (current.userId === actor.userId) {
    throw new Error("Cannot delete your own operator account");
  }

  allRecords[index] = {
    ...current,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveOperatorRegistry(allRecords);

  await logOperatorAudit(actor, "PERMISSION_CHANGED", {
    action: "operator_deleted",
    targetOperatorId: current.id,
  }, current.userId);
}

export async function resetControlCenterOperatorPassword(
  actor: ControlCenterOperatorContext,
  operatorId: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canResetPassword) {
    throw new Error("Permission denied");
  }

  const record = await findOperatorRecordById(operatorId);
  if (!record) {
    throw new Error("Operator not found");
  }

  await requestPasswordReset(record.email);

  await logOperatorAudit(actor, "PASSWORD_RESET", {
    action: "operator_password_reset",
    targetOperatorId: record.id,
  }, record.userId);
}

export async function forceLogoutControlCenterOperator(
  actor: ControlCenterOperatorContext,
  operatorId: string,
): Promise<number> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canForceLogout) {
    throw new Error("Permission denied");
  }

  const record = await findOperatorRecordById(operatorId);
  if (!record) {
    throw new Error("Operator not found");
  }

  const result = await prisma.iamSession.updateMany({
    where: { userId: record.userId, isActive: true },
    data: { isActive: false, revokedAt: new Date() },
  });

  await logOperatorAudit(actor, "SESSION_REVOKED", {
    action: "operator_force_logout",
    targetOperatorId: record.id,
    revokedCount: result.count,
  }, record.userId);

  return result.count;
}

export async function runControlCenterOperatorBulkAction(
  actor: ControlCenterOperatorContext,
  input: ControlCenterOperatorBulkActionInput,
): Promise<ControlCenterOperatorBulkActionResult> {
  const uniqueIds = [...new Set(input.operatorIds)];
  const succeeded: string[] = [];
  const failed: Array<{ operatorId: string; error: string }> = [];

  for (const operatorId of uniqueIds) {
    try {
      switch (input.action) {
        case "activate":
          await activateControlCenterOperator(actor, operatorId);
          break;
        case "suspend":
          await suspendControlCenterOperator(actor, operatorId);
          break;
        case "delete":
          await deleteControlCenterOperator(actor, operatorId);
          break;
      }
      succeeded.push(operatorId);
    } catch (error) {
      failed.push({
        operatorId,
        error: error instanceof Error ? error.message : "Action failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function exportControlCenterOperatorsCsv(
  actor: ControlCenterOperatorContext,
  query: ControlCenterOperatorDirectoryQuery = {},
): Promise<string> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  const permissions = buildPermissions(actor, isPlatformOwner);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const result = await queryControlCenterOperatorDirectory({
    ...query,
    page: 1,
    pageSize: 10_000,
  });

  const header = [
    "Operator ID",
    "Name",
    "Email",
    "Role",
    "Status",
    "Department",
    "MFA Enabled",
    "Active Sessions",
    "Permissions",
    "Last Login",
    "Created At",
  ];

  const rows = result.items.map((item) => [
    item.id,
    item.fullName,
    item.email,
    item.role,
    item.status,
    item.department ?? "",
    item.mfaEnabled ? "yes" : "no",
    String(item.activeSessions),
    String(item.permissionCount),
    item.lastLoginAt ?? "",
    item.createdAt,
  ]);

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(",")).join("\n");
}

export async function getControlCenterOperatorPermissionsForActor(
  actor: ControlCenterOperatorContext,
): Promise<ControlCenterOperatorPermissions> {
  const isPlatformOwner = await resolveIsPlatformOwner(actor);
  return buildPermissions(actor, isPlatformOwner);
}

export async function resolveActorOperatorRole(
  actor: ControlCenterOperatorContext,
): Promise<PlatformOperatorRole | null> {
  const record = await resolveActorRecord(actor);
  if (record) return record.role;
  const registry = await loadOperatorRegistry();
  if (isLegacyPlatformOwner(actor, registry)) return "PLATFORM_OWNER";
  return null;
}
