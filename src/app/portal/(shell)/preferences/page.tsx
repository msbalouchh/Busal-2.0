import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalPreferencesPanel } from "@/modules/customer-portal/components/customer-portal-preferences-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { getCustomerPreferences } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Preferences",
};

export default async function CustomerPortalPreferencesPage() {
  const context = await getCustomerPortalContext();
  const preferences = await getCustomerPreferences(
    context.business.id,
    context.customer.id,
    context.userId,
  );

  return (
    <PageContainer title="Preferences" description="Manage notifications and language settings.">
      <CustomerPortalPreferencesPanel preferences={preferences} />
    </PageContainer>
  );
}
