import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalReceiptsPanel } from "@/modules/customer-portal/components/customer-portal-receipts-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerReceipts } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Receipts",
};

export default async function CustomerPortalReceiptsPage() {
  const context = await getCustomerPortalContext();
  const receipts = await listCustomerReceipts(context.business.id, context.customer.id);

  return (
    <PageContainer title="Receipts" description="Download receipts from your orders.">
      <CustomerPortalReceiptsPanel receipts={receipts} />
    </PageContainer>
  );
}
