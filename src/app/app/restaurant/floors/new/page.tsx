import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateFloorForm } from "@/modules/floor-table-management/components/create-floor-form";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getFloorTableManagementContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface CreateFloorPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Create Floor" };
}

export default async function CreateFloorPage({ searchParams }: CreateFloorPageProps) {
  const { branchId } = await searchParams;
  const context = await getFloorTableManagementContext(branchId);

  if (!context.permissionsFlags.canCreateFloors || !context.selectedBranchId) {
    redirect(FLOOR_TABLE_MANAGEMENT_ROUTES.floorList());
  }

  return (
    <ApplicationPageTemplate
      title="Create floor"
      description="Add a new floor to organize tables for this branch."
      icon={Grid3X3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Floors & tables",
          href: FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(context.selectedBranchId),
        },
        { label: "Create" },
      ]}
    >
      <CreateFloorForm branchId={context.selectedBranchId} />
    </ApplicationPageTemplate>
  );
}
