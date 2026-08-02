import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { getCurrentUser } from "@/services/auth.service";
import { isBusinessSetupCompleted } from "@/services/business-setup.service";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";

export const requireApplicationAccess = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.login}?redirectTo=${ROUTES.application}`);
  }

  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    redirect(ROUTES.dashboard);
  }

  const setupCompleted = await isBusinessSetupCompleted(user.id);

  if (!setupCompleted) {
    redirect(ROUTES.businessOnboarding);
  }

  return user;
});
