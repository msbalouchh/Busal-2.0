import type {
  IamApiKeyType,
  IamAuditEventType,
  IamAuthMethod,
  IamIdentityType,
  IamMfaType,
  IamPolicyScope,
} from "@prisma/client";

export interface IdentityProviderDefinition {
  providerType: IamAuthMethod;
  name: string;
  description: string;
  oauthProvider?: string;
}

export interface PermissionEvaluationContext {
  permissions: Iterable<string>;
  roleSlug: string | null;
  isOwner: boolean;
  businessId: string | null;
  branchId: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
}

export interface AccessPolicyRules {
  passwordMinLength?: number;
  requireMfa?: boolean;
  sessionTimeoutMinutes?: number;
  allowedCountries?: string[];
  deniedIpAddresses?: string[];
  allowedIpAddresses?: string[];
  loginHoursStart?: string;
  loginHoursEnd?: string;
  requireDeviceTrust?: boolean;
}

export interface IamDashboardMetrics {
  totalIdentities: number;
  activeSessions: number;
  apiKeys: number;
  serviceAccounts: number;
  policies: number;
  failedLogins24h: number;
  mfaEnrollments: number;
}

export interface CreateApiKeyResult {
  id: string;
  keyPrefix: string;
  rawKey: string;
}

export interface CreateSessionInput {
  userId: string;
  businessId: string;
  identityId?: string | null;
  deviceName?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  country?: string | null;
}

export interface AuthenticateApiKeyInput {
  rawKey: string;
  requiredPermissions?: string[];
}

export interface AuthenticateApiKeyResult {
  valid: boolean;
  apiKeyId: string | null;
  permissions: string[];
  businessId: string | null;
  userId: string | null;
  keyType: IamApiKeyType | null;
}

export type { IamAuditEventType, IamIdentityType, IamMfaType, IamPolicyScope };
