import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditTableForm } from "@/modules/floor-table-management/components/edit-table-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getTableDetailContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditTablePageProps {
  params: Promise<{ floorId: string; tableId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: EditTablePageProps): Promise<Metadata> {
  const { floorId, tableId } = await params;
  const { branchId } = await searchParams;
  const context = await getTableDetailContext(branchId ?? "", floorId, tableId);
  return { title: `Edit ${context.table?.tableNumber ?? "Table"}` };
}

export default async function EditTablePage({ params, searchParams }: EditTablePageProps) {
  const { floorId, tableId } = await params;
  const { branchId } = await searchParams;
  const context = await getTableDetailContext(branchId ?? "", floorId, tableId);

  if (!context.floor || !context.table || !context.selectedBranchId) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdateTables) {
    redirect(
      FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floorId, tableId, context.selectedBranchId),
    );
  }

  if (context.table.status === "ARCHIVED") {
    redirect(
      FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(floorId, tableId, context.selectedBranchId),
    );
  }

  return (
    <ApplicationPageTemplate
      title={`Edit table ${context.table.tableNumber}`}
      description="Update table capacity, shape, and settings."
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
        {
          label: context.table.tableNumber,
          href: FLOOR_TABLE_MANAGEMENT_ROUTES.tableDetails(
            floorId,
            tableId,
            context.selectedBranchId,
          ),
        },
        { label: "Edit" },
      ]}
    >
      <EditTableForm branchId={context.selectedBranchId} floorId={floorId} table={context.table} />
    </ApplicationPageTemplate>
  );
}
