import "server-only";

import { ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { isValidInternalRedirect } from "@/modules/auth/lib/auth.utils";
import { isBusinessSetupCompleted } from "@/services/business-setup.service";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import { listCustomerMemberships } from "@/services/customer-portal.service";
import type { AuthUser } from "@/types/auth";

const BLOCKED_POST_AUTH_REDIRECTS = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.authCallback,
] as const;

function isAllowedPostAuthRedirect(path: string): boolean {
  if (!isValidInternalRedirect(path)) {
    return false;
  }

  return !BLOCKED_POST_AUTH_REDIRECTS.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`),
  );
}

export async function resolvePostAuthRedirect(
  user: AuthUser,
  redirectTo?: string | null,
): Promise<string> {
  if (redirectTo && isAllowedPostAuthRedirect(redirectTo)) {
    return redirectTo;
  }

  if (user.role === USER_ROLES.CUSTOMER) {
    return ROUTES.customerPortal;
  }

  const memberships = await listCustomerMemberships(user.id);
  if (memberships.length > 0 && user.role !== USER_ROLES.OWNER) {
    return ROUTES.customerPortal;
  }

  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    return ROUTES.dashboard;
  }

  const setupCompleted = await isBusinessSetupCompleted(user.id);

  if (!setupCompleted) {
    return ROUTES.businessOnboarding;
  }

  return ROUTES.application;
}
