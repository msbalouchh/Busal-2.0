import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FloorListPanel } from "@/modules/floor-table-management/components/floor-list-panel";
import { getFloorListContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type {
  FloorListQuery,
  FloorSortField,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorsPageProps {
  searchParams: Promise<{
    branchId?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Floors & Tables" };
}

export default async function FloorsPage({ searchParams }: FloorsPageProps) {
  const params = await searchParams;
  const query: FloorListQuery = {
    branchId: params.branchId ?? "",
    search: params.search,
    status: (params.status as FloorListQuery["status"]) ?? "ALL",
    sortBy: (params.sortBy as FloorSortField) ?? "displayOrder",
    sortDirection: (params.sortDirection as FloorListQuery["sortDirection"]) ?? "asc",
    page: params.page ? Number(params.page) : 1,
  };

  const context = await getFloorListContext(params.branchId ?? "", query);

  return (
    <ApplicationPageTemplate
      title="Floors & tables"
      description="Manage branch floors, table layouts, and seating capacity for dine-in operations."
      icon={Grid3X3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Floors & tables" },
      ]}
    >
      <FloorListPanel
        context={context}
        list={context.list}
        stats={context.stats}
        initialSearch={params.search ?? ""}
        initialStatus={params.status ?? "ALL"}
        initialSortBy={params.sortBy ?? "displayOrder"}
        initialSortDirection={params.sortDirection ?? "asc"}
      />
    </ApplicationPageTemplate>
  );
}
