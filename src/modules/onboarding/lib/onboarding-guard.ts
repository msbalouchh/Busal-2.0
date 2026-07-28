import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import { findActiveStaffByEmail } from "@/modules/staff-auth/services/staff-auth.service";
import {
  getOrCreateBusinessForOwner,
  isOnboardingCompleted,
} from "@/services/business-profile.service";
import { getCurrentUser } from "@/services/auth.service";

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return user;
}

export async function ensureOnboardingAccess() {
  const user = await requireAuthenticatedUser();
  const staff = await findActiveStaffByEmail(user.email);

  if (staff && staff.business.ownerId !== user.id) {
    redirect(ROUTES.dashboard);
  }

  const completed = await isOnboardingCompleted(user.id);

  if (completed) {
    redirect(ROUTES.dashboard);
  }

  const profile = await getOrCreateBusinessForOwner(user.id);

  return { user, profile };
}

export async function ensureDashboardAccess() {
  const context = await requireBusinessContext();
  return context;
}
