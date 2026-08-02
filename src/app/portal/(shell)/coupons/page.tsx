import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalCouponsPanel } from "@/modules/customer-portal/components/customer-portal-coupons-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerCoupons } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Coupons",
};

export default async function CustomerPortalCouponsPage() {
  const context = await getCustomerPortalContext();
  const coupons = await listCustomerCoupons(context.business.id);

  return (
    <PageContainer title="Coupons" description="Available discounts and offers.">
      <CustomerPortalCouponsPanel coupons={coupons} />
    </PageContainer>
  );
}
