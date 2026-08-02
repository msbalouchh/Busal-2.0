import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalGiftCardsPanel } from "@/modules/customer-portal/components/customer-portal-gift-cards-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerGiftCards } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Gift Cards",
};

export default async function CustomerPortalGiftCardsPage() {
  const context = await getCustomerPortalContext();
  const giftCards = await listCustomerGiftCards(context.business.id, context.customer.id);

  return (
    <PageContainer title="Gift Cards" description="Your redeemed vouchers and gift cards.">
      <CustomerPortalGiftCardsPanel giftCards={giftCards} />
    </PageContainer>
  );
}
