import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalSecurityPanel } from "@/modules/customer-portal/components/customer-portal-security-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";

export const metadata: Metadata = {
  title: "Security",
};

export default async function CustomerPortalSecurityPage() {
  await getCustomerPortalContext();

  return (
    <PageContainer title="Security" description="Update your account password.">
      <CustomerPortalSecurityPanel />
    </PageContainer>
  );
}
