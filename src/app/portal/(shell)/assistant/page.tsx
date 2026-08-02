import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalAssistantPanel } from "@/modules/customer-portal/components/customer-portal-assistant-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default async function CustomerPortalAssistantPage() {
  await getCustomerPortalContext();

  return (
    <PageContainer
      title="AI Assistant"
      description="Get instant help with orders, loyalty, and more."
    >
      <CustomerPortalAssistantPanel />
    </PageContainer>
  );
}
