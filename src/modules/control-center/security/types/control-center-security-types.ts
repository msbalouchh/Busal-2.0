import type { IamAccountStatus, IamAuditEventType } from "@prisma/client";

export interface ControlCenterSecurityPermissions {
  canView: boolean;
  canManageSessions: boolean;
  canManageAccounts: boolean;
  canManageApiKeys: boolean;
  canExport: boolean;
}

export interface ControlCenterSecurityOverview {
  healthScore: number;
  activeSessions: number;
  operatorSessions: number;
  failedLogins24h: number;
  mfaEnrolled: number;
  mfaEligible: number;
  lockedAccounts: number;
  suspendedAccounts: number;
  activeApiKeys: number;
  openSecurityAlerts: number;
  suspiciousEvents24h: number;
}

export interface ControlCenterPasswordPolicySummary {
  mfaRequired: boolean;
  passwordMinLength: number;
  sessionTimeoutMinutes: number;
  requireMfaPolicy: boolean;
}

export interface ControlCenterSecuritySessionItem {
  id: string;
  businessId: string | null;
  businessName: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  deviceName: string | null;
  browser: string | null;
  ipAddress: string | null;
  country: string | null;
  isOperator: boolean;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string | null;
}

export interface ControlCenterSecurityEventItem {
  id: string;
  businessId: string | null;
  businessName: string | null;
  userId: string | null;
  userEmail: string | null;
  eventType: IamAuditEventType;
  ipAddress: string | null;
  createdAt: string;
  isSuspicious: boolean;
}

export interface ControlCenterSecurityMfaItem {
  identityId: string;
  businessId: string | null;
  businessName: string | null;
  userEmail: string | null;
  mfaTypes: string[];
  isVerified: boolean;
}

export interface ControlCenterSecurityApiKeyItem {
  id: string;
  source: "iam" | "platform";
  businessId: string | null;
  businessName: string | null;
  name: string;
  keyPrefix: string;
  keyType: string;
  status: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ControlCenterSecurityAlertItem {
  id: string;
  source: "iam" | "monitoring" | "platform";
  title: string;
  severity: string;
  status: string;
  businessId: string | null;
  businessName: string | null;
  triggeredAt: string;
}

export interface ControlCenterSecurityAccountItem {
  id: string;
  businessId: string | null;
  businessName: string | null;
  name: string;
  email: string | null;
  status: IamAccountStatus;
  identityType: string;
  updatedAt: string;
}

export interface ControlCenterSecurityDirectoryQuery {
  search?: string;
  businessId?: string | null;
  eventType?: IamAuditEventType | null;
  accountStatus?: IamAccountStatus | null;
  sessionActive?: boolean | null;
  sortBy?: "createdAt" | "lastActivity" | "eventType" | "status";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterSecuritySessionQuery extends ControlCenterSecurityDirectoryQuery {
  operatorOnly?: boolean;
}

export interface ControlCenterSecurityEventQuery extends ControlCenterSecurityDirectoryQuery {
  suspiciousOnly?: boolean;
}

export interface ControlCenterSecurityPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterSecurityManagementBundle {
  overview: ControlCenterSecurityOverview;
  passwordPolicy: ControlCenterPasswordPolicySummary;
  permissions: ControlCenterSecurityPermissions;
  recentEvents: ControlCenterSecurityEventItem[];
  sessions: ControlCenterSecurityPaginatedResult<ControlCenterSecuritySessionItem>;
  mfaStatus: ControlCenterSecurityMfaItem[];
  apiKeys: ControlCenterSecurityApiKeyItem[];
  alerts: ControlCenterSecurityAlertItem[];
  lockedAccounts: ControlCenterSecurityAccountItem[];
}

export interface ControlCenterSecurityBulkSessionInput {
  sessionIds: string[];
}

export interface ControlCenterSecurityBulkSessionResult {
  succeeded: string[];
  failed: Array<{ sessionId: string; error: string }>;
}

export interface ControlCenterSecurityAccountActionInput {
  identityId: string;
  businessId: string;
}

export interface ControlCenterSecurityApiKeyActionInput {
  apiKeyId: string;
  businessId: string;
  source: "iam" | "platform";
}
