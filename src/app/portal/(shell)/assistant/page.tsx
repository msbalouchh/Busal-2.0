import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalAssistantPanel } from "@/modules/customer-portal/components/customer-portal-assistant-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { getCustomerAiIdentity } from "@/modules/customer-ai/services/customer-ai-identity.service";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default async function CustomerPortalAssistantPage() {
  const context = await getCustomerPortalContext();
  const identity = await getCustomerAiIdentity(context.business.id);

  return (
    <PageContainer
      title={`${identity.aiName} — AI Assistant`}
      description={`Get instant help from ${identity.whiteLabelName ?? identity.businessName}'s AI assistant.`}
    >
      <CustomerPortalAssistantPanel identity={identity} />
    </PageContainer>
  );
}
