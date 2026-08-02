import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalDashboardPanel } from "@/modules/customer-portal/components/customer-portal-dashboard-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { getCustomerDashboard } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function CustomerPortalDashboardPage() {
  const context = await getCustomerPortalContext();
  const dashboard = await getCustomerDashboard(
    context.userId,
    context.business.id,
    context.customer.id,
  );

  return (
    <PageContainer
      title="Dashboard"
      description={`Welcome back, ${context.customer.name}. Here's your overview at ${context.business.businessName}.`}
    >
      <CustomerPortalDashboardPanel context={context} dashboard={dashboard} />
    </PageContainer>
  );
}
