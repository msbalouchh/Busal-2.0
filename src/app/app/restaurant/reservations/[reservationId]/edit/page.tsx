import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditReservationForm } from "@/modules/reservation-management/components/edit-reservation-form";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import {
  getReservationDetailsContext,
  getReservationFormContext,
} from "@/modules/reservation-management/lib/get-reservation-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditReservationPageProps {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Edit Reservation" };
}

export default async function EditReservationPage({
  params,
  searchParams,
}: EditReservationPageProps) {
  const { reservationId } = await params;
  const query = await searchParams;
  const context = await getReservationDetailsContext(query.branchId ?? "", reservationId);
  const formContext = await getReservationFormContext(context.selectedBranchId ?? "");

  return (
    <ApplicationPageTemplate
      title="Edit reservation"
      description={`Update booking details for ${context.reservation.guestName}.`}
      icon={CalendarDays}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Reservations",
          href: RESERVATION_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId ?? ""),
        },
        {
          label: context.reservation.reservationNumber,
          href: RESERVATION_MANAGEMENT_ROUTES.details(
            context.reservation.id,
            context.selectedBranchId ?? "",
          ),
        },
        { label: "Edit" },
      ]}
    >
      <EditReservationForm
        branchId={context.selectedBranchId ?? ""}
        reservation={context.reservation}
        tables={formContext.tables}
        staff={formContext.staff}
        customers={formContext.customers}
        disabled={!context.permissionsFlags.canUpdate}
      />
    </ApplicationPageTemplate>
  );
}
