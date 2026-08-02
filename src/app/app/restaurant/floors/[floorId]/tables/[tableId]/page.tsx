import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { TableDetailsPanel } from "@/modules/floor-table-management/components/table-details-panel";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getTableDetailContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface TableDetailsPageProps {
  params: Promise<{ floorId: string; tableId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: TableDetailsPageProps): Promise<Metadata> {
  const { floorId, tableId } = await params;
  const { branchId } = await searchParams;
  const context = await getTableDetailContext(branchId ?? "", floorId, tableId);
  return { title: context.table?.tableNumber ?? "Table Details" };
}

export default async function TableDetailsPage({ params, searchParams }: TableDetailsPageProps) {
  const { floorId, tableId } = await params;
  const { branchId } = await searchParams;
  const context = await getTableDetailContext(branchId ?? "", floorId, tableId);

  if (!context.floor || !context.table || !context.selectedBranchId) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={`Table ${context.table.tableNumber}`}
      description="Table details, status, and floor assignment."
      icon={Grid3X3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Floors & tables",
          href: FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(context.selectedBranchId),
        },
        {
          label: context.floor.name,
          href: FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floorId, context.selectedBranchId),
        },
        { label: context.table.tableNumber },
      ]}
    >
      <TableDetailsPanel
        context={context}
        floor={context.floor}
        table={context.table}
        floors={context.floors}
      />
    </ApplicationPageTemplate>
  );
}
