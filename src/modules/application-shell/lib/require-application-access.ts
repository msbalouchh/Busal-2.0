import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getWorkspaceAccessSnapshot } from "@/modules/auth/lib/workspace-access";
import { resolveSubscriptionAccess } from "@/modules/commercial-foundation/services/subscription-access.service";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import { getCurrentUser } from "@/services/auth.service";

function resolveBusinessOnboardingPath(businessSetupStep: number | null): string {
  if (businessSetupStep && businessSetupStep > 1) {
    return `${ROUTES.businessOnboarding}?step=${businessSetupStep}`;
  }

  return ROUTES.businessOnboarding;
}

export const requireApplicationAccess = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?redirectTo=${ROUTES.application}`);
  }

  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    redirect(ROUTES.dashboard);
  }

  const workspace = await getWorkspaceAccessSnapshot(user.id);

  if (workspace.state === "no_workspace") {
    redirect(ROUTES.businessOnboarding);
  }

  if (workspace.state === "provisioning_incomplete") {
    redirect(resolveBusinessOnboardingPath(workspace.businessSetupStep));
  }

  if (workspace.businessId) {
    const subscriptionAccess = await resolveSubscriptionAccess(workspace.businessId);
    if (!subscriptionAccess.allowed && subscriptionAccess.redirectTo) {
      redirect(subscriptionAccess.redirectTo);
    }
  }

  return user;
});
