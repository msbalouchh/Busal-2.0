import "server-only";

import { ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { isValidInternalRedirect } from "@/modules/auth/lib/auth.utils";
import { getWorkspaceAccessSnapshot } from "@/modules/auth/lib/workspace-access";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import { listCustomerMemberships } from "@/services/customer-portal.service";
import type { AuthUser } from "@/types/auth";

const BLOCKED_POST_AUTH_REDIRECTS = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.authCallback,
] as const;

const WORKSPACE_GATED_PREFIXES = [ROUTES.dashboard, ROUTES.application] as const;

function isAllowedPostAuthRedirect(path: string): boolean {
  if (!isValidInternalRedirect(path)) {
    return false;
  }

  return !BLOCKED_POST_AUTH_REDIRECTS.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`),
  );
}

function requiresProvisionedWorkspace(path: string): boolean {
  return WORKSPACE_GATED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function resolveBusinessOnboardingPath(businessSetupStep: number | null): string {
  if (businessSetupStep && businessSetupStep > 1) {
    return `${ROUTES.businessOnboarding}?step=${businessSetupStep}`;
  }

  return ROUTES.businessOnboarding;
}

async function resolveOwnerWorkspaceDestination(user: AuthUser): Promise<string> {
  const workspace = await getWorkspaceAccessSnapshot(user.id);

  if (workspace.state === "no_workspace") {
    return ROUTES.businessOnboarding;
  }

  if (workspace.state === "provisioning_incomplete") {
    return resolveBusinessOnboardingPath(workspace.businessSetupStep);
  }

  return ROUTES.dashboard;
}

/** Resolves where an authenticated user should land after login or OAuth. */
export async function resolvePostAuthRedirect(
  user: AuthUser,
  redirectTo?: string | null,
): Promise<string> {
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

  const workspaceDestination = await resolveOwnerWorkspaceDestination(user);

  if (!redirectTo || !isAllowedPostAuthRedirect(redirectTo)) {
    return workspaceDestination;
  }

  if (requiresProvisionedWorkspace(redirectTo)) {
    const workspace = await getWorkspaceAccessSnapshot(user.id);

    if (workspace.state !== "provisioning_complete") {
      return workspaceDestination;
    }
  }

  return redirectTo;
}
