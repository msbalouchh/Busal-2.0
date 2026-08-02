import type { Metadata } from "next";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalReservationsPanel } from "@/modules/customer-portal/components/customer-portal-reservations-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import { listCustomerReservations } from "@/services/customer-portal.service";

export const metadata: Metadata = {
  title: "Reservations",
};

export default async function CustomerPortalReservationsPage() {
  const context = await getCustomerPortalContext();
  const reservations = await listCustomerReservations(context.business.id, context.customer.id);

  return (
    <PageContainer title="Reservations" description="View your table reservations.">
      <CustomerPortalReservationsPanel reservations={reservations} />
    </PageContainer>
  );
}
