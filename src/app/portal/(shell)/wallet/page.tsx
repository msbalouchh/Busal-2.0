import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalWalletPanel } from "@/modules/customer-portal/components/customer-portal-wallet-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { getCustomerWallet } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Wallet",
};

export default async function CustomerPortalWalletPage() {
  const context = await getCustomerPortalContext();
  const wallet = await getCustomerWallet(context.business.id, context.customer.id);

  return (
    <PageContainer title="Wallet" description="Your points balance and voucher activity.">
      <CustomerPortalWalletPanel wallet={wallet} />
    </PageContainer>
  );
}
