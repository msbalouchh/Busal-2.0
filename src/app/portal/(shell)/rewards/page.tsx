import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalRewardsPanel } from "@/modules/customer-portal/components/customer-portal-rewards-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerRewards } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Rewards",
};

export default async function CustomerPortalRewardsPage() {
  const context = await getCustomerPortalContext();
  const rewards = await listCustomerRewards(context.business.id, context.customer.id);

  return (
    <PageContainer title="Rewards" description="Redeem your loyalty points for rewards.">
      <CustomerPortalRewardsPanel
        rewards={rewards}
        pointsBalance={context.customer.loyaltyPoints}
      />
    </PageContainer>
  );
}
