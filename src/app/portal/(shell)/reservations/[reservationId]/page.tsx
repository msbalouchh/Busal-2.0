import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/common/page-container";
import { CustomerPortalReservationDetailPanel } from "@/modules/customer-portal/components/customer-portal-reservation-detail-panel";
import { getCustomerPortalContext } from "@/modules/customer-portal/lib/get-customer-portal-context";
import {
  CustomerPortalError,
  getCustomerReservationDetail,
} from "@/services/customer-portal.service";

interface CustomerPortalReservationDetailPageProps {
  params: Promise<{ reservationId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reservation Details" };
}

export default async function CustomerPortalReservationDetailPage({
  params,
}: CustomerPortalReservationDetailPageProps) {
  const context = await getCustomerPortalContext();
  const { reservationId } = await params;

  try {
    const reservation = await getCustomerReservationDetail(
      context.business.id,
      context.customer.id,
      reservationId,
    );

    return (
      <PageContainer
        title={`Reservation ${reservation.reservationNumber}`}
        description="Reservation details and guest information."
      >
        <CustomerPortalReservationDetailPanel reservation={reservation} />
      </PageContainer>
    );
  } catch (error) {
    if (error instanceof CustomerPortalError) {
      notFound();
    }
    throw error;
  }
}
