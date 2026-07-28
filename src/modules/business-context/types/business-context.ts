import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { StaffSessionData } from "@/modules/staff-auth/types/staff-session";
import type { BranchData } from "@/services/business-management.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface ActiveBusinessCookie {
  userId: string;
  businessId: string;
}

export interface ActiveBranchCookie {
  userId: string;
  businessId: string;
  branchId: string;
}

export interface BusinessOption {
  id: string;
  name: string;
  isOnboarded: boolean;
}

export interface BranchOption {
  id: string;
  name: string;
  isMain: boolean;
}

export interface BusinessContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  branch: BranchData | null;
  branchId: string | null;
  roleSlug: string | null;
  permissions: string[];
  authorization: AuthorizationContext;
  staffSession: StaffSessionData | null;
  isOwner: boolean;
  accessibleBusinesses: BusinessOption[];
  accessibleBranches: BranchOption[];
}

export interface ClientBusinessContext {
  businessId: string;
  businessName: string;
  branchId: string | null;
  branchName: string | null;
  roleSlug: string | null;
  isOwner: boolean;
  accessibleBusinesses: BusinessOption[];
  accessibleBranches: BranchOption[];
}
