import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalProfilePanel } from "@/modules/customer-portal/components/customer-portal-profile-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function CustomerPortalProfilePage() {
  const context = await getCustomerPortalContext();

  return (
    <PageContainer title="Profile" description="View and update your customer profile.">
      <CustomerPortalProfilePanel context={context} />
    </PageContainer>
  );
}
