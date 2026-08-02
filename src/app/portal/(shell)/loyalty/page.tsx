import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalLoyaltyPanel } from "@/modules/customer-portal/components/customer-portal-loyalty-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { getCustomerLoyaltyDashboard } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Loyalty",
};

export default async function CustomerPortalLoyaltyPage() {
  const context = await getCustomerPortalContext();
  const loyalty = await getCustomerLoyaltyDashboard(context.business.id, context.customer.id);

  return (
    <PageContainer title="Loyalty" description="Track your points, tier, and redemptions.">
      <CustomerPortalLoyaltyPanel loyalty={loyalty} />
    </PageContainer>
  );
}
