import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ReservationDetailsPanel } from "@/modules/reservation-management/components/reservation-details-panel";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import {
  getReservationDetailsContext,
  getReservationFormContext,
} from "@/modules/reservation-management/lib/get-reservation-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface ReservationDetailsPageProps {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reservation Details" };
}

export default async function ReservationDetailsPage({
  params,
  searchParams,
}: ReservationDetailsPageProps) {
  const { reservationId } = await params;
  const query = await searchParams;
  const context = await getReservationDetailsContext(query.branchId ?? "", reservationId);
  const formContext = await getReservationFormContext(context.selectedBranchId ?? "");

  return (
    <ApplicationPageTemplate
      title={context.reservation.guestName}
      description={`${context.reservation.reservationNumber} · party of ${context.reservation.partySize}`}
      icon={CalendarDays}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Reservations",
          href: RESERVATION_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId ?? ""),
        },
        { label: context.reservation.reservationNumber },
      ]}
    >
      <ReservationDetailsPanel
        branchId={context.selectedBranchId ?? ""}
        reservation={context.reservation}
        permissionsFlags={context.permissionsFlags}
        tables={formContext.tables}
        staff={formContext.staff}
      />
    </ApplicationPageTemplate>
  );
}
