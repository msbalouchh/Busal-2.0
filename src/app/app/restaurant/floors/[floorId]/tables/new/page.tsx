import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateTableForm } from "@/modules/floor-table-management/components/create-table-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getFloorDetailContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateTablePageProps {
  params: Promise<{ floorId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Create Table" };
}

export default async function CreateTablePage({ params, searchParams }: CreateTablePageProps) {
  const { floorId } = await params;
  const { branchId } = await searchParams;
  const context = await getFloorDetailContext(branchId ?? "", floorId);

  if (!context.floor || !context.selectedBranchId) {
    notFound();
  }

  if (!context.permissionsFlags.canCreateTables) {
    redirect(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floorId, context.selectedBranchId));
  }

  return (
    <ApplicationPageTemplate
      title="Create table"
      description={`Add a table to ${context.floor.name}.`}
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
        { label: "Create table" },
      ]}
    >
      <CreateTableForm branchId={context.selectedBranchId} floorId={floorId} />
    </ApplicationPageTemplate>
  );
}
