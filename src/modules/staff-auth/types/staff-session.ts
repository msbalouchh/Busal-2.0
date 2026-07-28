import type { PermissionCode } from "@/modules/authorization/types/authorization";

import type { ACCOUNT_TYPES } from "@/modules/staff-auth/constants/session";

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

export interface StaffSessionData {
  staffId: string;
  userId: string;
  businessId: string;
  branchId: string | null;
  roleSlug: string;
  roleName: string;
  permissions: PermissionCode[];
  staffName: string;
  businessName: string | null;
}

export interface StaffAuthContext {
  staffSession: StaffSessionData;
}

export interface LoginSessionResult {
  accountType: AccountType;
  staffSession: StaffSessionData | null;
}

export interface ResolvedBusinessAccess {
  businessId: string;
  isOwner: boolean;
  staffSession: StaffSessionData | null;
}
