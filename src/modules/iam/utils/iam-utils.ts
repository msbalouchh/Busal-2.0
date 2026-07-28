import type {
  IamAccessPolicy,
  IamApiKey,
  IamIdentity,
  IamIdentityProvider,
  IamSecurityAuditLog,
  IamServiceAccount,
  IamSession,
} from "@prisma/client";

import type { IamDashboardMetrics } from "@/modules/iam/types/iam-types";

export type IamDashboardView = IamDashboardMetrics;

export function serializeIamIdentity(identity: IamIdentity) {
  return {
    id: identity.id,
    name: identity.name,
    email: identity.email,
    identityType: identity.identityType,
    status: identity.status,
    branchId: identity.branchId,
    createdAt: identity.createdAt.toISOString(),
  };
}

export function serializeIamSession(session: IamSession) {
  return {
    id: session.id,
    deviceName: session.deviceName,
    browser: session.browser,
    ipAddress: session.ipAddress,
    country: session.country,
    loginAt: session.loginAt.toISOString(),
    lastActivityAt: session.lastActivityAt.toISOString(),
    isActive: session.isActive,
  };
}

export function serializeIamApiKey(apiKey: IamApiKey) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    keyType: apiKey.keyType,
    keyPrefix: apiKey.keyPrefix,
    permissions: apiKey.permissions,
    usageCount: apiKey.usageCount,
    lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
    expiresAt: apiKey.expiresAt?.toISOString() ?? null,
  };
}

export function serializeIamServiceAccount(account: IamServiceAccount) {
  return {
    id: account.id,
    name: account.name,
    slug: account.slug,
    description: account.description,
    permissions: account.permissions,
    isActive: account.isActive,
    usageCount: account.usageCount,
    lastUsedAt: account.lastUsedAt?.toISOString() ?? null,
  };
}

export function serializeIamAccessPolicy(policy: IamAccessPolicy) {
  return {
    id: policy.id,
    name: policy.name,
    scope: policy.scope,
    roleSlug: policy.roleSlug,
    branchId: policy.branchId,
    isActive: policy.isActive,
    rules: policy.rules,
  };
}

export function serializeIamIdentityProvider(provider: IamIdentityProvider) {
  return {
    id: provider.id,
    name: provider.name,
    providerType: provider.providerType,
    isEnabled: provider.isEnabled,
  };
}

export function serializeIamSecurityAuditLog(log: IamSecurityAuditLog) {
  return {
    id: log.id,
    eventType: log.eventType,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
    metadata: log.metadata,
  };
}

export function serializeIamDashboard(metrics: IamDashboardMetrics): IamDashboardView {
  return metrics;
}
