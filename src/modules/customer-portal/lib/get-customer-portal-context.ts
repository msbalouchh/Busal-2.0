import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { getCustomerPortalBusinessCookie } from "@/modules/customer-portal/services/customer-portal-session.service";
import {
  CustomerPortalError,
  resolveCustomerPortalContext,
  type CustomerPortalContextData,
} from "@/services/customer-portal.service";
import { getCurrentUser } from "@/services/auth.service";

export type CustomerPortalContext = CustomerPortalContextData;

export const getCustomerPortalContext = cache(async (): Promise<CustomerPortalContext> => {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `${CUSTOMER_PORTAL_ROUTES.login}?redirectTo=${encodeURIComponent(CUSTOMER_PORTAL_ROUTES.dashboard)}`,
    );
  }

  if (user.role !== USER_ROLES.CUSTOMER) {
    const preferredBusinessId = await getCustomerPortalBusinessCookie();
    try {
      return await resolveCustomerPortalContext(
        user.id,
        user.email,
        user.fullName,
        preferredBusinessId,
      );
    } catch {
      redirect(ROUTES.application);
    }
  }

  try {
    const preferredBusinessId = await getCustomerPortalBusinessCookie();
    return await resolveCustomerPortalContext(
      user.id,
      user.email,
      user.fullName,
      preferredBusinessId,
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      redirect(CUSTOMER_PORTAL_ROUTES.register);
    }
    throw error;
  }
});

export async function requireCustomerPortalContext(): Promise<CustomerPortalContext> {
  return getCustomerPortalContext();
}
