import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalMessagesPanel } from "@/modules/customer-portal/components/customer-portal-messages-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerMessages } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function CustomerPortalMessagesPage() {
  const context = await getCustomerPortalContext();
  const messages = await listCustomerMessages(context.business.id, context.customer.id);

  return (
    <PageContainer title="Messages" description="Send messages and view conversation history.">
      <CustomerPortalMessagesPanel messages={messages} />
    </PageContainer>
  );
}
