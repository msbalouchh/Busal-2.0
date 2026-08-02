import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ReservationListPanel } from "@/modules/reservation-management/components/reservation-list-panel";
import type { ReservationViewMode } from "@/modules/reservation-management/constants/routes";
import { getReservationListContext } from "@/modules/reservation-management/lib/get-reservation-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  ReservationListQuery,
  ReservationSortField,
} from "@/modules/reservation-management/types/reservation-management-types";
import type { ReservationSource, ReservationStatus } from "@prisma/client";

interface ReservationsPageProps {
  searchParams: Promise<{
    branchId?: string;
    search?: string;
    status?: string;
    source?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
    view?: string;
    date?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reservations" };
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const params = await searchParams;
  const query: ReservationListQuery = {
    branchId: params.branchId ?? "",
    search: params.search,
    status: (params.status as ReservationStatus | "ALL") ?? "ALL",
    source: (params.source as ReservationSource | "ALL") ?? "ALL",
    sortBy: (params.sortBy as ReservationSortField) ?? "reservationDate",
    sortDirection: (params.sortDirection as ReservationListQuery["sortDirection"]) ?? "asc",
    page: params.page ? Number(params.page) : 1,
    view: (params.view as ReservationViewMode) ?? "list",
    date: params.date,
  };

  const context = await getReservationListContext(params.branchId ?? "", query);

  return (
    <ApplicationPageTemplate
      title="Reservations"
      description="Manage guest bookings, table assignments, and seating workflow across branches."
      icon={CalendarDays}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Reservations" },
      ]}
    >
      <ReservationListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        calendarEntries={context.calendarEntries}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialSource={params.source ?? "ALL"}
        initialSortBy={params.sortBy ?? "reservationDate"}
        initialSortDirection={params.sortDirection ?? "asc"}
        initialView={(params.view as ReservationViewMode) ?? "list"}
        initialDate={params.date ?? new Date().toISOString().slice(0, 10)}
      />
    </ApplicationPageTemplate>
  );
}
