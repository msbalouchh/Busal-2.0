import "server-only";

import { cookies } from "next/headers";

import { CUSTOMER_PORTAL_COOKIE } from "@/modules/customer-portal/constants/routes";

export async function getCustomerPortalBusinessCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_PORTAL_COOKIE)?.value ?? null;
}

export async function setCustomerPortalBusinessCookie(businessId: string): Promise<void> {
  const store = await cookies();
  store.set(CUSTOMER_PORTAL_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/portal",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearCustomerPortalBusinessCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_PORTAL_COOKIE);
}
