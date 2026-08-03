import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getWorkspaceAccessSnapshot } from "@/modules/auth/lib/workspace-access";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import { getCurrentUser } from "@/services/auth.service";

/** Ensures dashboard access requires a fully provisioned business workspace. */
export async function requireWorkspaceDashboardAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?redirectTo=${ROUTES.dashboard}`);
  }

  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    return user;
  }

  const workspace = await getWorkspaceAccessSnapshot(user.id);

  if (workspace.state === "no_workspace" || workspace.state === "provisioning_incomplete") {
    redirect(ROUTES.businessOnboarding);
  }

  return user;
}
