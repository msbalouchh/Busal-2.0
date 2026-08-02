import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditFloorForm } from "@/modules/floor-table-management/components/edit-floor-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getFloorDetailContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface EditFloorPageProps {
  params: Promise<{ floorId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: EditFloorPageProps): Promise<Metadata> {
  const { floorId } = await params;
  const { branchId } = await searchParams;
  const context = await getFloorDetailContext(branchId ?? "", floorId);
  return { title: `Edit ${context.floor?.name ?? "Floor"}` };
}

export default async function EditFloorPage({ params, searchParams }: EditFloorPageProps) {
  const { floorId } = await params;
  const { branchId } = await searchParams;
  const context = await getFloorDetailContext(branchId ?? "", floorId);

  if (!context.floor || !context.selectedBranchId) {
    notFound();
  }

  if (!context.permissionsFlags.canUpdateFloors) {
    redirect(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floorId, context.selectedBranchId));
  }

  if (context.floor.status === "ARCHIVED") {
    redirect(FLOOR_TABLE_MANAGEMENT_ROUTES.floorDetails(floorId, context.selectedBranchId));
  }

  return (
    <ApplicationPageTemplate
      title={`Edit ${context.floor.name}`}
      description="Update floor name, description, and display order."
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
        { label: "Edit" },
      ]}
    >
      <EditFloorForm branchId={context.selectedBranchId} floor={context.floor} />
    </ApplicationPageTemplate>
  );
}
