import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalAddressesPanel } from "@/modules/customer-portal/components/customer-portal-addresses-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerAddresses } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Addresses",
};

export default async function CustomerPortalAddressesPage() {
  const context = await getCustomerPortalContext();
  const addresses = await listCustomerAddresses(context.customer.id);

  return (
    <PageContainer title="Addresses" description="Manage your saved delivery addresses.">
      <CustomerPortalAddressesPanel addresses={addresses} />
    </PageContainer>
  );
}
