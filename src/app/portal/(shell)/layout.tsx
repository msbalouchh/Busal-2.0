import type { ReactNode } from "react";

import { CustomerPortalShell } from "@/modules/customer-portal/components/customer-portal-shell";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";

export const dynamic = "force-dynamic";

interface CustomerPortalShellLayoutProps {
  children: ReactNode;
}

export default async function CustomerPortalShellLayout({
  children,
}: CustomerPortalShellLayoutProps) {
  const context = await getCustomerPortalContext();

  return <CustomerPortalShell context={context}>{children}</CustomerPortalShell>;
}
