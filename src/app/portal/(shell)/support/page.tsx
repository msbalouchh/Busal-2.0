import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalSupportPanel } from "@/modules/customer-portal/components/customer-portal-support-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerSupportTickets } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Support",
};

export default async function CustomerPortalSupportPage() {
  const context = await getCustomerPortalContext();
  const tickets = await listCustomerSupportTickets(context.business.id, context.customer.id);

  return (
    <PageContainer title="Support" description="Create tickets and track support requests.">
      <CustomerPortalSupportPanel tickets={tickets} />
    </PageContainer>
  );
}
