import type { IamAuditEventType } from "@prisma/client";

export const PLATFORM_OPERATOR_ROLES = [
  "PLATFORM_OWNER",
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "SUPPORT",
  "FINANCE",
  "SALES",
  "CUSTOMER_SUCCESS",
  "DEVELOPER",
  "READ_ONLY",
] as const;

export type PlatformOperatorRole = (typeof PLATFORM_OPERATOR_ROLES)[number];

export const OPERATOR_STATUSES = ["active", "suspended"] as const;

export type OperatorStatus = (typeof OPERATOR_STATUSES)[number];

export interface ControlCenterOperatorPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSuspend: boolean;
  canActivate: boolean;
  canResetPassword: boolean;
  canForceLogout: boolean;
  canAssignRole: boolean;
  canManagePermissions: boolean;
  canExport: boolean;
  isPlatformOwner: boolean;
}

export interface ControlCenterOperatorDirectoryQuery {
  search?: string;
  role?: PlatformOperatorRole | null;
  status?: OperatorStatus | null;
  department?: string | null;
  mfaEnabled?: boolean | null;
  sortBy?: "createdAt" | "fullName" | "email" | "role" | "lastLogin" | "status";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterOperatorStatistics {
  totalOperators: number;
  activeOperators: number;
  suspendedOperators: number;
  mfaEnabledOperators: number;
  activeSessions: number;
  platformOwners: number;
}

export interface ControlCenterOperatorDirectoryItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: PlatformOperatorRole;
  status: OperatorStatus;
  department: string | null;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  activeSessions: number;
  permissionCount: number;
  createdAt: string;
}

export interface ControlCenterOperatorDirectoryResult {
  items: ControlCenterOperatorDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statistics: ControlCenterOperatorStatistics;
}

export interface ControlCenterOperatorActivityItem {
  id: string;
  eventType: IamAuditEventType | string;
  title: string;
  description: string;
  createdAt: string;
  actorEmail: string | null;
}

export interface ControlCenterOperatorAuditItem {
  id: string;
  eventType: IamAuditEventType | string;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ControlCenterOperatorSessionItem {
  id: string;
  deviceName: string | null;
  browser: string | null;
  ipAddress: string | null;
  loginAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export interface ControlCenterOperatorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: PlatformOperatorRole;
  status: OperatorStatus;
  department: string | null;
  permissions: string[];
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  mfaTypes: string[];
  activeSessions: number;
  createdAt: string;
  updatedAt: string;
  sessions: ControlCenterOperatorSessionItem[];
  activities: ControlCenterOperatorActivityItem[];
  auditLogs: ControlCenterOperatorAuditItem[];
}

export interface ControlCenterOperatorManagementBundle {
  directory: ControlCenterOperatorDirectoryResult;
  permissions: ControlCenterOperatorPermissions;
}

export interface ControlCenterOperatorDetailBundle {
  profile: ControlCenterOperatorProfile;
  permissions: ControlCenterOperatorPermissions;
}

export interface CreateControlCenterOperatorInput {
  fullName: string;
  email: string;
  role: PlatformOperatorRole;
  department?: string | null;
  permissions?: string[];
}

export interface UpdateControlCenterOperatorInput {
  operatorId: string;
  fullName?: string;
  department?: string | null;
}

export interface AssignControlCenterOperatorRoleInput {
  operatorId: string;
  role: PlatformOperatorRole;
}

export interface ManageControlCenterOperatorPermissionsInput {
  operatorId: string;
  permissions: string[];
}

export interface ControlCenterOperatorBulkActionInput {
  operatorIds: string[];
  action: "activate" | "suspend" | "delete";
}

export interface ControlCenterOperatorBulkActionResult {
  succeeded: string[];
  failed: Array<{ operatorId: string; error: string }>;
}
