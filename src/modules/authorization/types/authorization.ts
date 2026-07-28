import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

import type { AUTHORIZATION_ERROR_CODES } from "@/modules/authorization/constants/permissions";

export type PermissionCode = string;

export type AuthorizationErrorCode =
  (typeof AUTHORIZATION_ERROR_CODES)[keyof typeof AUTHORIZATION_ERROR_CODES];

export interface PermissionRecord {
  id: string;
  code: PermissionCode;
  name: string;
  description: string | null;
  module: string;
}

export interface AuthorizationContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  permissions: Set<PermissionCode>;
  roleSlug: string | null;
  isOwner: boolean;
}

export interface AuthorizationLogEntry {
  userId: string;
  businessId: string;
  role: string | null;
  permission: PermissionCode | PermissionCode[] | null;
  timestamp: string;
  result: "allowed" | "denied";
  reason?: AuthorizationErrorCode;
}

export type ProtectedActionContext = AuthorizationContext;

export interface RouteGuardOptions {
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  requireAll?: boolean;
  role?: string;
}

export interface PermissionCheckInput {
  permissions: Iterable<PermissionCode>;
  required: PermissionCode | PermissionCode[];
  mode?: "any" | "all";
}
