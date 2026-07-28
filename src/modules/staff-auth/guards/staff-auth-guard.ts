import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import {
  requireBusinessContext,
  requireBusinessContextForApi,
} from "@/modules/business-context/services/business-context.service";
import { BusinessContextError } from "@/modules/business-context/utils/business-context-errors";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { StaffSessionData } from "@/modules/staff-auth/types/staff-session";
import { StaffAuthError } from "@/modules/staff-auth/utils/staff-auth-errors";
import { getCurrentUser } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface StaffDashboardContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  staffSession: StaffSessionData | null;
  authorization: AuthorizationContext;
}

export async function requireStaffAuthenticatedUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return user;
}

export async function ensureStaffDashboardAccess(): Promise<StaffDashboardContext> {
  const context = await requireBusinessContext();

  return {
    user: context.user,
    business: context.business,
    staffSession: context.staffSession,
    authorization: context.authorization,
  };
}

export async function protectStaffApiRoute(): Promise<StaffDashboardContext> {
  try {
    const context = await requireBusinessContextForApi();

    return {
      user: context.user,
      business: context.business,
      staffSession: context.staffSession,
      authorization: context.authorization,
    };
  } catch (error) {
    if (error instanceof BusinessContextError) {
      throw new StaffAuthError("SESSION_INVALID");
    }

    throw error;
  }
}
