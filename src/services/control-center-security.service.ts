import "server-only";

import type { IamAccountStatus, IamAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { DEFAULT_IAM_POLICY_RULES } from "@/modules/iam/constants/routes";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import { CONTROL_CENTER_SECURITY_PAGE_SIZE } from "@/modules/control-center/security/constants/control-center-security";
import type {
  ControlCenterSecurityAccountItem,
  ControlCenterSecurityAlertItem,
  ControlCenterSecurityApiKeyItem,
  ControlCenterSecurityBulkSessionInput,
  ControlCenterSecurityBulkSessionResult,
  ControlCenterSecurityEventItem,
  ControlCenterSecurityEventQuery,
  ControlCenterSecurityManagementBundle,
  ControlCenterSecurityMfaItem,
  ControlCenterSecurityOverview,
  ControlCenterSecurityPaginatedResult,
  ControlCenterPasswordPolicySummary,
  ControlCenterSecurityPermissions,
  ControlCenterSecuritySessionItem,
  ControlCenterSecuritySessionQuery,
} from "@/modules/control-center/security/types/control-center-security-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import { rotateApiKey } from "@/services/api-key-manager.service";
import {
  createIamApiKey,
  lockIamIdentity,
  revokeIamApiKey,
  suspendIamIdentity,
  unlockIamIdentity,
} from "@/services/iam.service";

function buildPermissions(
  operator: ControlCenterOperatorContext,
): ControlCenterSecurityPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canView:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
    canManageSessions:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY_SESSIONS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY),
    canManageAccounts:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY_ACCOUNTS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY),
    canManageApiKeys:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY_API_KEYS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY),
    canExport:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY_EXPORT) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SECURITY),
  };
}

function isOperatorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getControlCenterOperatorEmails().includes(email.trim().toLowerCase());
}

function computeHealthScore(input: {
  failedLogins24h: number;
  lockedAccounts: number;
  totalIdentities: number;
  mfaEnrolled: number;
  mfaEligible: number;
  openSecurityAlerts: number;
  suspiciousEvents24h: number;
}): number {
  let score = 100;
  score -= Math.min(25, input.failedLogins24h * 2);
  score -= Math.min(15, input.suspiciousEvents24h * 3);
  score -= Math.min(20, input.openSecurityAlerts * 4);

  if (input.totalIdentities > 0) {
    const lockedRatio = input.lockedAccounts / input.totalIdentities;
    score -= Math.min(15, lockedRatio * 100 * 0.15);
  }

  if (input.mfaEligible > 0) {
    const adoption = input.mfaEnrolled / input.mfaEligible;
    score -= Math.min(25, (1 - adoption) * 25);
  }

  return Math.max(0, Math.round(score));
}

async function loadPasswordPolicy(): Promise<ControlCenterPasswordPolicySummary> {
  ensureBootstrapSettingsEngine();

  const mfaSetting = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: "security.mfa_required",
      scope: "PLATFORM",
      scopeIdentifier: "platform",
    },
    select: { value: true },
  });

  const mfaRequired = mfaSetting?.value === true;

  return {
    mfaRequired,
    passwordMinLength: DEFAULT_IAM_POLICY_RULES.passwordMinLength,
    sessionTimeoutMinutes: DEFAULT_IAM_POLICY_RULES.sessionTimeoutMinutes,
    requireMfaPolicy: DEFAULT_IAM_POLICY_RULES.requireMfa || mfaRequired,
  };
}

async function buildOverview(): Promise<ControlCenterSecurityOverview> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const operatorEmails = getControlCenterOperatorEmails();

  const [
    activeSessions,
    operatorSessions,
    failedLogins24h,
    mfaEnrolled,
    mfaEligible,
    lockedAccounts,
    suspendedAccounts,
    activeIamApiKeys,
    activePlatformApiKeys,
    suspiciousEvents24h,
    openMonitoringAlerts,
    totalIdentities,
  ] = await Promise.all([
    prisma.iamSession.count({ where: { isActive: true } }),
    operatorEmails.length > 0
      ? prisma.iamSession.count({
          where: {
            isActive: true,
            user: { email: { in: operatorEmails, mode: "insensitive" } },
          },
        })
      : Promise.resolve(0),
    prisma.iamSecurityAuditLog.count({
      where: { eventType: "LOGIN_FAILED", createdAt: { gte: since24h } },
    }),
    prisma.iamMfaEnrollment.count({ where: { isVerified: true } }),
    prisma.iamIdentity.count({ where: { identityType: "HUMAN" } }),
    prisma.iamIdentity.count({ where: { status: "LOCKED" } }),
    prisma.iamIdentity.count({ where: { status: "SUSPENDED" } }),
    prisma.iamApiKey.count({ where: { revokedAt: null } }),
    prisma.platformApiKey.count({ where: { status: "ACTIVE" } }),
    prisma.iamSecurityAuditLog.count({
      where: {
        eventType: { in: ["SUSPICIOUS_ACTIVITY", "POLICY_VIOLATION"] },
        createdAt: { gte: since24h },
      },
    }),
    prisma.monitoringAlert.count({ where: { status: "OPEN" } }),
    prisma.iamIdentity.count(),
  ]);

  const openSecurityAlerts = openMonitoringAlerts + lockedAccounts + suspiciousEvents24h;

  return {
    healthScore: computeHealthScore({
      failedLogins24h,
      lockedAccounts,
      totalIdentities,
      mfaEnrolled,
      mfaEligible,
      openSecurityAlerts,
      suspiciousEvents24h,
    }),
    activeSessions,
    operatorSessions,
    failedLogins24h,
    mfaEnrolled,
    mfaEligible,
    lockedAccounts,
    suspendedAccounts,
    activeApiKeys: activeIamApiKeys + activePlatformApiKeys,
    openSecurityAlerts,
    suspiciousEvents24h,
  };
}

function mapSession(
  session: {
    id: string;
    businessId: string | null;
    userId: string | null;
    deviceName: string | null;
    browser: string | null;
    ipAddress: string | null;
    country: string | null;
    loginAt: Date;
    lastActivityAt: Date;
    expiresAt: Date | null;
    user: { email: string; fullName: string | null } | null;
    business: { businessName: string | null } | null;
  },
): ControlCenterSecuritySessionItem {
  return {
    id: session.id,
    businessId: session.businessId,
    businessName: session.business?.businessName ?? null,
    userId: session.userId,
    userEmail: session.user?.email ?? null,
    userName: session.user?.fullName ?? null,
    deviceName: session.deviceName,
    browser: session.browser,
    ipAddress: session.ipAddress,
    country: session.country,
    isOperator: isOperatorEmail(session.user?.email),
    loginAt: session.loginAt.toISOString(),
    lastActivityAt: session.lastActivityAt.toISOString(),
    expiresAt: session.expiresAt?.toISOString() ?? null,
  };
}

function mapEvent(
  event: {
    id: string;
    businessId: string | null;
    userId: string | null;
    eventType: IamAuditEventType;
    ipAddress: string | null;
    createdAt: Date;
    user: { email: string } | null;
    business: { businessName: string | null } | null;
  },
): ControlCenterSecurityEventItem {
  return {
    id: event.id,
    businessId: event.businessId,
    businessName: event.business?.businessName ?? null,
    userId: event.userId,
    userEmail: event.user?.email ?? null,
    eventType: event.eventType,
    ipAddress: event.ipAddress,
    createdAt: event.createdAt.toISOString(),
    isSuspicious:
      event.eventType === "SUSPICIOUS_ACTIVITY" ||
      event.eventType === "POLICY_VIOLATION" ||
      event.eventType === "LOGIN_FAILED",
  };
}

export async function queryControlCenterSecuritySessions(
  query: ControlCenterSecuritySessionQuery = {},
): Promise<ControlCenterSecurityPaginatedResult<ControlCenterSecuritySessionItem>> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_SECURITY_PAGE_SIZE;
  const operatorEmails = getControlCenterOperatorEmails();

  const where: Prisma.IamSessionWhereInput = {
    isActive: query.sessionActive ?? true,
  };

  if (query.businessId) {
    where.businessId = query.businessId;
  }

  if (query.operatorOnly && operatorEmails.length > 0) {
    where.user = { email: { in: operatorEmails, mode: "insensitive" } };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { deviceName: { contains: search, mode: "insensitive" } },
      { browser: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { business: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.IamSessionOrderByWithRelationInput =
    query.sortBy === "lastActivity"
      ? { lastActivityAt: query.sortDirection ?? "desc" }
      : { loginAt: query.sortDirection ?? "desc" };

  const [sessions, total] = await Promise.all([
    prisma.iamSession.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, fullName: true } },
        business: { select: { businessName: true } },
      },
    }),
    prisma.iamSession.count({ where }),
  ]);

  return {
    items: sessions.map(mapSession),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function queryControlCenterSecurityEvents(
  query: ControlCenterSecurityEventQuery = {},
): Promise<ControlCenterSecurityPaginatedResult<ControlCenterSecurityEventItem>> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_SECURITY_PAGE_SIZE;

  const where: Prisma.IamSecurityAuditLogWhereInput = {};

  if (query.businessId) {
    where.businessId = query.businessId;
  }

  if (query.eventType) {
    where.eventType = query.eventType;
  }

  if (query.suspiciousOnly) {
    where.eventType = { in: ["SUSPICIOUS_ACTIVITY", "POLICY_VIOLATION", "LOGIN_FAILED"] };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { eventType: search as IamAuditEventType },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { business: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [events, total] = await Promise.all([
    prisma.iamSecurityAuditLog.findMany({
      where,
      orderBy: { createdAt: query.sortDirection ?? "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true } },
        business: { select: { businessName: true } },
      },
    }),
    prisma.iamSecurityAuditLog.count({ where }),
  ]);

  return {
    items: events.map(mapEvent),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

async function loadMfaStatus(limit = 50): Promise<ControlCenterSecurityMfaItem[]> {
  const enrollments = await prisma.iamMfaEnrollment.findMany({
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      identity: { select: { id: true, email: true } },
      business: { select: { businessName: true } },
    },
  });

  const grouped = new Map<string, ControlCenterSecurityMfaItem>();

  for (const enrollment of enrollments) {
    const key = enrollment.identityId;
    const existing = grouped.get(key);

    if (existing) {
      existing.mfaTypes.push(enrollment.mfaType);
      existing.isVerified = existing.isVerified || enrollment.isVerified;
      continue;
    }

    grouped.set(key, {
      identityId: enrollment.identityId,
      businessId: enrollment.businessId,
      businessName: enrollment.business?.businessName ?? null,
      userEmail: enrollment.identity.email,
      mfaTypes: [enrollment.mfaType],
      isVerified: enrollment.isVerified,
    });
  }

  return Array.from(grouped.values());
}

async function loadApiKeys(limit = 50): Promise<ControlCenterSecurityApiKeyItem[]> {
  const [iamKeys, platformKeys] = await Promise.all([
    prisma.iamApiKey.findMany({
      where: { revokedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { business: { select: { businessName: true } } },
    }),
    prisma.platformApiKey.findMany({
      where: { status: "ACTIVE" },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { business: { select: { businessName: true } } },
    }),
  ]);

  const iamItems: ControlCenterSecurityApiKeyItem[] = iamKeys.map((key) => ({
    id: key.id,
    source: "iam",
    businessId: key.businessId,
    businessName: key.business?.businessName ?? null,
    name: key.name,
    keyPrefix: key.keyPrefix,
    keyType: key.keyType,
    status: key.revokedAt ? "REVOKED" : "ACTIVE",
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  }));

  const platformItems: ControlCenterSecurityApiKeyItem[] = platformKeys.map((key) => ({
    id: key.id,
    source: "platform",
    businessId: key.businessId,
    businessName: key.business?.businessName ?? null,
    name: key.name,
    keyPrefix: key.hashedKey.slice(0, 8),
    keyType: "PLATFORM",
    status: key.status,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  }));

  return [...iamItems, ...platformItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

async function loadSecurityAlerts(limit = 20): Promise<ControlCenterSecurityAlertItem[]> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [iamAlerts, monitoringAlerts, platformAlerts] = await Promise.all([
    prisma.iamSecurityAuditLog.findMany({
      where: {
        eventType: { in: ["SUSPICIOUS_ACTIVITY", "POLICY_VIOLATION", "ACCOUNT_LOCKED"] },
        createdAt: { gte: since7d },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { businessName: true } },
      },
    }),
    prisma.monitoringAlert.findMany({
      where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      take: limit,
      orderBy: { triggeredAt: "desc" },
      include: { business: { select: { businessName: true } } },
    }),
    prisma.platformAlert.findMany({
      where: { status: "ACTIVE" },
      take: limit,
      orderBy: { triggeredAt: "desc" },
      include: { business: { select: { businessName: true } } },
    }),
  ]);

  const items: ControlCenterSecurityAlertItem[] = [
    ...iamAlerts.map((alert) => ({
      id: alert.id,
      source: "iam" as const,
      title: alert.eventType.replace(/_/g, " "),
      severity: alert.eventType === "SUSPICIOUS_ACTIVITY" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      businessId: alert.businessId,
      businessName: alert.business?.businessName ?? null,
      triggeredAt: alert.createdAt.toISOString(),
    })),
    ...monitoringAlerts.map((alert) => ({
      id: alert.id,
      source: "monitoring" as const,
      title: alert.title,
      severity: alert.alertType,
      status: alert.status,
      businessId: alert.businessId,
      businessName: alert.business?.businessName ?? null,
      triggeredAt: alert.triggeredAt.toISOString(),
    })),
    ...platformAlerts.map((alert) => ({
      id: alert.id,
      source: "platform" as const,
      title: alert.name,
      severity: alert.severity,
      status: alert.status,
      businessId: alert.businessId,
      businessName: alert.business?.businessName ?? null,
      triggeredAt: alert.triggeredAt.toISOString(),
    })),
  ];

  return items
    .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
    .slice(0, limit);
}

async function loadLockedAccounts(limit = 50): Promise<ControlCenterSecurityAccountItem[]> {
  const identities = await prisma.iamIdentity.findMany({
    where: { status: { in: ["LOCKED", "SUSPENDED", "PENDING_RESET"] } },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { business: { select: { businessName: true } } },
  });

  return identities.map((identity) => ({
    id: identity.id,
    businessId: identity.businessId,
    businessName: identity.business?.businessName ?? null,
    name: identity.name,
    email: identity.email,
    status: identity.status,
    identityType: identity.identityType,
    updatedAt: identity.updatedAt.toISOString(),
  }));
}

export async function getControlCenterSecurityManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterSecuritySessionQuery = {},
): Promise<ControlCenterSecurityManagementBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const [overview, passwordPolicy, recentEventsResult, sessions, mfaStatus, apiKeys, alerts, lockedAccounts] =
    await Promise.all([
      buildOverview(),
      loadPasswordPolicy(),
      queryControlCenterSecurityEvents({ page: 1, pageSize: 10, sortDirection: "desc" }),
      queryControlCenterSecuritySessions(query),
      loadMfaStatus(),
      loadApiKeys(),
      loadSecurityAlerts(),
      loadLockedAccounts(),
    ]);

  return {
    overview,
    passwordPolicy,
    permissions,
    recentEvents: recentEventsResult.items,
    sessions,
    mfaStatus,
    apiKeys,
    alerts,
    lockedAccounts,
  };
}

async function logOperatorSecurityAction(
  operator: ControlCenterOperatorContext,
  eventType: IamAuditEventType,
  metadata: Record<string, unknown>,
  businessId?: string | null,
): Promise<void> {
  await prisma.iamSecurityAuditLog.create({
    data: {
      businessId: businessId ?? null,
      userId: operator.userId,
      eventType,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

export async function terminateControlCenterSecuritySession(
  operator: ControlCenterOperatorContext,
  sessionId: string,
): Promise<void> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageSessions) {
    throw new Error("Permission denied");
  }

  const session = await prisma.iamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, businessId: true, userId: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  await prisma.iamSession.update({
    where: { id: sessionId },
    data: { isActive: false, revokedAt: new Date() },
  });

  await logOperatorSecurityAction(
    operator,
    "SESSION_REVOKED",
    { sessionId, operatorAction: true },
    session.businessId,
  );
}

export async function bulkRevokeControlCenterSecuritySessions(
  operator: ControlCenterOperatorContext,
  input: ControlCenterSecurityBulkSessionInput,
): Promise<ControlCenterSecurityBulkSessionResult> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageSessions) {
    throw new Error("Permission denied");
  }

  const uniqueIds = [...new Set(input.sessionIds)];
  const succeeded: string[] = [];
  const failed: Array<{ sessionId: string; error: string }> = [];

  for (const sessionId of uniqueIds) {
    try {
      await terminateControlCenterSecuritySession(operator, sessionId);
      succeeded.push(sessionId);
    } catch (error) {
      failed.push({
        sessionId,
        error: error instanceof Error ? error.message : "Revoke failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function lockControlCenterSecurityAccount(
  operator: ControlCenterOperatorContext,
  identityId: string,
  businessId: string,
): Promise<void> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageAccounts) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await lockIamIdentity(platform, identityId);
}

export async function unlockControlCenterSecurityAccount(
  operator: ControlCenterOperatorContext,
  identityId: string,
  businessId: string,
): Promise<void> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageAccounts) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await unlockIamIdentity(platform, identityId);
}

export async function disableControlCenterSecurityAccount(
  operator: ControlCenterOperatorContext,
  identityId: string,
  businessId: string,
): Promise<void> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageAccounts) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await suspendIamIdentity(platform, identityId);
}

export async function enableControlCenterSecurityAccount(
  operator: ControlCenterOperatorContext,
  identityId: string,
  businessId: string,
): Promise<void> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageAccounts) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await unlockIamIdentity(platform, identityId);
}

export async function rotateControlCenterSecurityApiKey(
  operator: ControlCenterOperatorContext,
  apiKeyId: string,
  businessId: string,
  source: "iam" | "platform",
): Promise<{ rawKey?: string; keyPrefix?: string }> {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageApiKeys) {
    throw new Error("Permission denied");
  }

  if (source === "platform") {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    const result = await rotateApiKey(business.ownerId, apiKeyId);
    if (!result) {
      throw new Error("Unable to rotate platform API key");
    }

    await logOperatorSecurityAction(
      operator,
      "API_KEY_CREATED",
      { apiKeyId, source: "platform", rotated: true },
      businessId,
    );

    return { rawKey: result.rawKey, keyPrefix: result.maskedKey };
  }

  const existing = await prisma.iamApiKey.findFirst({
    where: { id: apiKeyId, businessId, revokedAt: null },
  });

  if (!existing) {
    throw new Error("API key not found");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  const created = await createIamApiKey(platform, {
    name: `${existing.name} (rotated)`,
    keyType: existing.keyType,
    permissions: existing.permissions,
    expiresAt: existing.expiresAt,
  });

  await revokeIamApiKey(platform, apiKeyId);

  await logOperatorSecurityAction(
    operator,
    "API_KEY_CREATED",
    { apiKeyId, newApiKeyId: created.id, source: "iam", rotated: true },
    businessId,
  );

  return { rawKey: created.rawKey, keyPrefix: created.keyPrefix };
}

export async function exportControlCenterSecurityReport(
  operator: ControlCenterOperatorContext,
): Promise<string> {
  const permissions = buildPermissions(operator);
  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const [overview, passwordPolicy, lockedAccounts, recentEvents] = await Promise.all([
    buildOverview(),
    loadPasswordPolicy(),
    loadLockedAccounts(100),
    queryControlCenterSecurityEvents({ page: 1, pageSize: 100, sortDirection: "desc" }),
  ]);

  const summaryRows = [
    ["Metric", "Value"],
    ["Health Score", String(overview.healthScore)],
    ["Active Sessions", String(overview.activeSessions)],
    ["Operator Sessions", String(overview.operatorSessions)],
    ["Failed Logins (24h)", String(overview.failedLogins24h)],
    ["MFA Enrolled", String(overview.mfaEnrolled)],
    ["Locked Accounts", String(overview.lockedAccounts)],
    ["Open Security Alerts", String(overview.openSecurityAlerts)],
    ["Suspicious Events (24h)", String(overview.suspiciousEvents24h)],
    ["MFA Required", passwordPolicy.mfaRequired ? "Yes" : "No"],
    ["Password Min Length", String(passwordPolicy.passwordMinLength)],
    ["Session Timeout (min)", String(passwordPolicy.sessionTimeoutMinutes)],
  ];

  const lockedRows = [
    ["Account", "Email", "Status", "Business", "Updated At"],
    ...lockedAccounts.map((account: ControlCenterSecurityAccountItem) => [
      account.name,
      account.email ?? "",
      account.status,
      account.businessName ?? "",
      account.updatedAt,
    ]),
  ];

  const eventRows = [
    ["Event", "User", "Business", "IP", "At"],
    ...recentEvents.items.map((event: ControlCenterSecurityEventItem) => [
      event.eventType,
      event.userEmail ?? "",
      event.businessName ?? "",
      event.ipAddress ?? "",
      event.createdAt,
    ]),
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const formatSection = (rows: string[][]) =>
    rows.map((row) => row.map((cell) => escape(String(cell))).join(",")).join("\n");

  return [
    "# Security Overview",
    formatSection(summaryRows),
    "",
    "# Locked Accounts",
    formatSection(lockedRows),
    "",
    "# Recent Security Events",
    formatSection(eventRows),
  ].join("\n");
}
