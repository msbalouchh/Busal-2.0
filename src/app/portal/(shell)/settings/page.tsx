import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalSettingsPanel } from "@/modules/customer-portal/components/customer-portal-settings-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function CustomerPortalSettingsPage() {
  const context = await getCustomerPortalContext();

  return (
    <PageContainer title="Settings" description="Account summary and quick navigation.">
      <CustomerPortalSettingsPanel context={context} />
    </PageContainer>
  );
}
