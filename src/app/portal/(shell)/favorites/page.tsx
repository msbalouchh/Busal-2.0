import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalFavoritesPanel } from "@/modules/customer-portal/components/customer-portal-favorites-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerFavorites } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Favorites",
};

export default async function CustomerPortalFavoritesPage() {
  const context = await getCustomerPortalContext();
  const favorites = await listCustomerFavorites(context.business.id, context.customer.id);

  return (
    <PageContainer title="Favorites" description="Items you order most often.">
      <CustomerPortalFavoritesPanel favorites={favorites} />
    </PageContainer>
  );
}
