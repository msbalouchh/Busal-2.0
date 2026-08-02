import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateReservationForm } from "@/modules/reservation-management/components/create-reservation-form";
import { RESERVATION_MANAGEMENT_ROUTES } from "@/modules/reservation-management/constants/routes";
import { getReservationFormContext } from "@/modules/reservation-management/lib/get-reservation-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateReservationPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Create Reservation" };
}

export default async function CreateReservationPage({ searchParams }: CreateReservationPageProps) {
  const params = await searchParams;
  const context = await getReservationFormContext(params.branchId ?? "");

  if (!context.selectedBranchId) {
    return (
      <ApplicationPageTemplate
        title="Create reservation"
        description="Select a branch before creating a reservation."
        icon={CalendarDays}
        breadcrumbs={[
          { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
          { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
          { label: "Reservations", href: RESERVATION_MANAGEMENT_ROUTES.list() },
          { label: "Create" },
        ]}
      >
        <p className="text-muted-foreground text-sm">
          Select a branch from the reservations dashboard first.
        </p>
      </ApplicationPageTemplate>
    );
  }

  return (
    <ApplicationPageTemplate
      title="Create reservation"
      description="Book a table, assign staff, and capture guest details."
      icon={CalendarDays}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Reservations",
          href: RESERVATION_MANAGEMENT_ROUTES.listForBranch(context.selectedBranchId),
        },
        { label: "Create" },
      ]}
    >
      <CreateReservationForm
        branchId={context.selectedBranchId}
        tables={context.tables}
        staff={context.staff}
        customers={context.customers}
        disabled={!context.permissionsFlags.canCreate}
      />
    </ApplicationPageTemplate>
  );
}
