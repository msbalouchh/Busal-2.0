import "server-only";

import type { IamApiKeyType, IamAuditEventType, IamPolicyScope, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  generateApiKeyRaw,
  generateBackupCodes,
  generateSessionToken,
  generateTotpSecret,
  hashApiKey,
} from "@/modules/iam/engine/crypto-engine";
import { mergePolicyRules } from "@/modules/iam/engine/policy-engine";
import { DEFAULT_IAM_POLICY_RULES } from "@/modules/iam/constants/routes";
import {
  DEFAULT_IAM_PROVIDERS,
  ensureBootstrapIamProviders,
} from "@/modules/iam/plugins/bootstrap-iam";
import type {
  AccessPolicyRules,
  AuthenticateApiKeyInput,
  AuthenticateApiKeyResult,
  CreateSessionInput,
  IamDashboardMetrics,
} from "@/modules/iam/types/iam-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logSecurityEvent(input: {
  businessId?: string | null;
  userId?: string | null;
  identityId?: string | null;
  eventType: IamAuditEventType;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.iamSecurityAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      identityId: input.identityId ?? null,
      eventType: input.eventType,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function ensureIamDefaults(businessId: string): Promise<void> {
  ensureBootstrapIamProviders();

  for (const provider of DEFAULT_IAM_PROVIDERS) {
    const existing = await prisma.iamIdentityProvider.findFirst({
      where: { businessId, providerType: provider.providerType },
    });

    if (existing) {
      continue;
    }

    await prisma.iamIdentityProvider.create({
      data: {
        businessId,
        providerType: provider.providerType,
        name: provider.name,
        config: { description: provider.description },
        isEnabled: provider.providerType === "EMAIL_PASSWORD" || provider.providerType === "OAUTH2",
      },
    });
  }

  const policyExists = await prisma.iamAccessPolicy.findFirst({
    where: { businessId, scope: "BUSINESS", name: "Default Business Policy" },
  });

  if (!policyExists) {
    await prisma.iamAccessPolicy.create({
      data: {
        businessId,
        scope: "BUSINESS",
        name: "Default Business Policy",
        rules: DEFAULT_IAM_POLICY_RULES as Prisma.InputJsonValue,
      },
    });
  }
}

export async function ensureHumanIdentity(platform: BusinessContext): Promise<{ id: string }> {
  const existing = await prisma.iamIdentity.findFirst({
    where: {
      userId: platform.user.id,
      businessId: platform.business.id,
      identityType: "HUMAN",
    },
  });

  if (existing) {
    return { id: existing.id };
  }

  const identity = await prisma.iamIdentity.create({
    data: {
      userId: platform.user.id,
      businessId: platform.business.id,
      branchId: platform.branchId,
      identityType: "HUMAN",
      name: platform.user.fullName ?? platform.user.email,
      email: platform.user.email,
      status: "ACTIVE",
    },
  });

  return { id: identity.id };
}

export async function createIamSession(
  platform: BusinessContext,
  input: CreateSessionInput,
): Promise<{ id: string; sessionToken: string }> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_SESSIONS);

  const identity = input.identityId
    ? { id: input.identityId }
    : await ensureHumanIdentity(platform);

  const sessionToken = generateSessionToken();
  const session = await prisma.iamSession.create({
    data: {
      identityId: identity.id,
      userId: input.userId,
      businessId: input.businessId,
      sessionToken,
      deviceName: input.deviceName ?? null,
      browser: input.browser ?? null,
      ipAddress: input.ipAddress ?? null,
      country: input.country ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8),
    },
  });

  await logSecurityEvent({
    businessId: input.businessId,
    userId: input.userId,
    identityId: identity.id,
    eventType: "LOGIN",
    ipAddress: input.ipAddress ?? null,
    metadata: { sessionId: session.id },
  });

  return { id: session.id, sessionToken };
}

export async function listIamSessions(businessId: string, userId?: string) {
  return prisma.iamSession.findMany({
    where: {
      businessId,
      isActive: true,
      ...(userId ? { userId } : {}),
    },
    orderBy: { lastActivityAt: "desc" },
  });
}

export async function revokeIamSession(
  platform: BusinessContext,
  sessionId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_SESSIONS);

  await prisma.iamSession.updateMany({
    where: { id: sessionId, businessId: platform.business.id },
    data: { isActive: false, revokedAt: new Date() },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SESSION_REVOKED",
    metadata: { sessionId },
  });
}

export async function revokeAllIamSessions(
  platform: BusinessContext,
  exceptSessionId?: string,
): Promise<number> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_SESSIONS);

  const result = await prisma.iamSession.updateMany({
    where: {
      businessId: platform.business.id,
      userId: platform.user.id,
      isActive: true,
      ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}),
    },
    data: { isActive: false, revokedAt: new Date() },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SESSION_REVOKED",
    metadata: { revokedCount: result.count, allSessions: true },
  });

  return result.count;
}

export async function createIamApiKey(
  platform: BusinessContext,
  input: {
    name: string;
    keyType: IamApiKeyType;
    permissions: string[];
    expiresAt?: Date | null;
  },
) {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_API_KEYS);

  const prefix =
    input.keyType === "PERSONAL" ? "busal_p" : input.keyType === "BUSINESS" ? "busal_b" : "busal_m";
  const generated = generateApiKeyRaw(prefix);

  const apiKey = await prisma.iamApiKey.create({
    data: {
      businessId: platform.business.id,
      userId: input.keyType === "PERSONAL" ? platform.user.id : null,
      keyType: input.keyType,
      name: input.name,
      keyPrefix: generated.keyPrefix,
      keyHash: generated.keyHash,
      permissions: input.permissions,
      expiresAt: input.expiresAt ?? null,
      createdById: platform.user.id,
    },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "API_KEY_CREATED",
    metadata: { apiKeyId: apiKey.id, keyType: input.keyType },
  });

  return { id: apiKey.id, keyPrefix: generated.keyPrefix, rawKey: generated.rawKey };
}

export async function authenticateIamApiKey(
  input: AuthenticateApiKeyInput,
): Promise<AuthenticateApiKeyResult> {
  const keyHash = hashApiKey(input.rawKey);
  const apiKey = await prisma.iamApiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!apiKey) {
    return {
      valid: false,
      apiKeyId: null,
      permissions: [],
      businessId: null,
      userId: null,
      keyType: null,
    };
  }

  if (input.requiredPermissions?.length) {
    const granted = new Set(apiKey.permissions);
    const allowed = input.requiredPermissions.every((permission) => granted.has(permission));

    if (!allowed) {
      return {
        valid: false,
        apiKeyId: apiKey.id,
        permissions: apiKey.permissions,
        businessId: apiKey.businessId,
        userId: apiKey.userId,
        keyType: apiKey.keyType,
      };
    }
  }

  await prisma.iamApiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  if (apiKey.businessId) {
    await logSecurityEvent({
      businessId: apiKey.businessId,
      userId: apiKey.userId,
      eventType: "API_KEY_USED",
      metadata: { apiKeyId: apiKey.id },
    });
  }

  return {
    valid: true,
    apiKeyId: apiKey.id,
    permissions: apiKey.permissions,
    businessId: apiKey.businessId,
    userId: apiKey.userId,
    keyType: apiKey.keyType,
  };
}

export async function revokeIamApiKey(platform: BusinessContext, apiKeyId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_API_KEYS);

  await prisma.iamApiKey.updateMany({
    where: { id: apiKeyId, businessId: platform.business.id },
    data: { revokedAt: new Date() },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "API_KEY_REVOKED",
    metadata: { apiKeyId },
  });
}

export async function createIamServiceAccount(
  platform: BusinessContext,
  input: {
    name: string;
    slug: string;
    description?: string;
    permissions: string[];
    branchId?: string | null;
    agentRecordId?: string | null;
  },
) {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_SERVICE_ACCOUNTS);

  const account = await prisma.iamServiceAccount.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      permissions: input.permissions,
      agentRecordId: input.agentRecordId ?? null,
    },
  });

  await prisma.iamIdentity.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      identityType: input.agentRecordId ? "AI_AGENT" : "SERVICE_ACCOUNT",
      name: input.name,
      agentRecordId: input.agentRecordId ?? null,
      status: "ACTIVE",
      metadata: { serviceAccountId: account.id },
    },
  });

  return account;
}

export async function recordServiceAccountUsage(
  businessId: string,
  serviceAccountId: string,
): Promise<void> {
  await prisma.iamServiceAccount.updateMany({
    where: { id: serviceAccountId, businessId },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  await logSecurityEvent({
    businessId,
    eventType: "SERVICE_ACCOUNT_USED",
    metadata: { serviceAccountId },
  });
}

export async function createIamAccessPolicy(
  platform: BusinessContext,
  input: {
    name: string;
    scope: IamPolicyScope;
    rules: AccessPolicyRules;
    branchId?: string | null;
    roleSlug?: string | null;
  },
) {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_POLICIES);

  return prisma.iamAccessPolicy.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? null,
      roleSlug: input.roleSlug ?? null,
      scope: input.scope,
      name: input.name,
      rules: input.rules as Prisma.InputJsonValue,
    },
  });
}

export async function getEffectiveAccessPolicies(
  businessId: string,
  input: { branchId?: string | null; roleSlug?: string | null },
): Promise<AccessPolicyRules> {
  const policies = await prisma.iamAccessPolicy.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [
        { scope: "PLATFORM" },
        { scope: "BUSINESS" },
        ...(input.branchId ? [{ scope: "BRANCH" as const, branchId: input.branchId }] : []),
        ...(input.roleSlug ? [{ scope: "ROLE" as const, roleSlug: input.roleSlug }] : []),
      ],
    },
  });

  if (policies.length === 0) {
    return DEFAULT_IAM_POLICY_RULES;
  }

  return mergePolicyRules(policies.map((policy) => policy.rules as AccessPolicyRules));
}

export async function enrollIamMfa(
  platform: BusinessContext,
  mfaType: "TOTP" | "EMAIL_OTP" | "SMS_OTP" | "BACKUP_CODE",
) {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_IDENTITIES);

  const identity = await ensureHumanIdentity(platform);
  const backupCodes = mfaType === "BACKUP_CODE" ? generateBackupCodes() : [];

  const enrollment = await prisma.iamMfaEnrollment.upsert({
    where: {
      identityId_mfaType: {
        identityId: identity.id,
        mfaType,
      },
    },
    create: {
      identityId: identity.id,
      userId: platform.user.id,
      businessId: platform.business.id,
      mfaType,
      secret: mfaType === "TOTP" ? { secret: generateTotpSecret() } : undefined,
      isVerified: true,
      backupCodes,
    },
    update: {
      isVerified: true,
      backupCodes: backupCodes.length > 0 ? backupCodes : undefined,
    },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    identityId: identity.id,
    eventType: "MFA_ENABLED",
    metadata: { mfaType },
  });

  return enrollment;
}

export async function lockIamIdentity(
  platform: BusinessContext,
  identityId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_IDENTITIES);

  await prisma.iamIdentity.updateMany({
    where: { id: identityId, businessId: platform.business.id },
    data: { status: "LOCKED" },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    identityId,
    eventType: "ACCOUNT_LOCKED",
  });
}

export async function unlockIamIdentity(
  platform: BusinessContext,
  identityId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_IDENTITIES);

  await prisma.iamIdentity.updateMany({
    where: { id: identityId, businessId: platform.business.id },
    data: { status: "ACTIVE" },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    identityId,
    eventType: "ACCOUNT_UNLOCKED",
  });
}

export async function suspendIamIdentity(
  platform: BusinessContext,
  identityId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_IDENTITIES);

  await prisma.iamIdentity.updateMany({
    where: { id: identityId, businessId: platform.business.id },
    data: { status: "SUSPENDED" },
  });
}

export async function forcePasswordReset(
  platform: BusinessContext,
  identityId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.IAM_MANAGE_IDENTITIES);

  await prisma.iamIdentity.updateMany({
    where: { id: identityId, businessId: platform.business.id },
    data: { status: "PENDING_RESET" },
  });

  await logSecurityEvent({
    businessId: platform.business.id,
    userId: platform.user.id,
    identityId,
    eventType: "PASSWORD_RESET",
  });
}

export async function listIamIdentities(businessId: string) {
  return prisma.iamIdentity.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listIamApiKeys(businessId: string) {
  return prisma.iamApiKey.findMany({
    where: { businessId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function listIamServiceAccounts(businessId: string) {
  return prisma.iamServiceAccount.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listIamAccessPolicies(businessId: string) {
  return prisma.iamAccessPolicy.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listIamIdentityProviders(businessId: string) {
  return prisma.iamIdentityProvider.findMany({
    where: { OR: [{ businessId }, { businessId: null }] },
    orderBy: { name: "asc" },
  });
}

export async function listIamSecurityAuditLogs(businessId: string, limit = 50) {
  return prisma.iamSecurityAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getIamDashboard(businessId: string): Promise<IamDashboardMetrics> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);

  const [
    totalIdentities,
    activeSessions,
    apiKeys,
    serviceAccounts,
    policies,
    failedLogins24h,
    mfaEnrollments,
  ] = await Promise.all([
    prisma.iamIdentity.count({ where: { businessId } }),
    prisma.iamSession.count({ where: { businessId, isActive: true } }),
    prisma.iamApiKey.count({ where: { businessId, revokedAt: null } }),
    prisma.iamServiceAccount.count({ where: { businessId, isActive: true } }),
    prisma.iamAccessPolicy.count({ where: { businessId, isActive: true } }),
    prisma.iamSecurityAuditLog.count({
      where: { businessId, eventType: "LOGIN_FAILED", createdAt: { gte: since } },
    }),
    prisma.iamMfaEnrollment.count({ where: { businessId, isVerified: true } }),
  ]);

  return {
    totalIdentities,
    activeSessions,
    apiKeys,
    serviceAccounts,
    policies,
    failedLogins24h,
    mfaEnrollments,
  };
}

export { ensureBootstrapIamProviders };
