import type { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FloorDetailsPanel } from "@/modules/floor-table-management/components/floor-details-panel";
import { FLOOR_TABLE_MANAGEMENT_ROUTES } from "@/modules/floor-table-management/constants/routes";
import { getFloorDetailContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface FloorDetailsPageProps {
  params: Promise<{ floorId: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: FloorDetailsPageProps): Promise<Metadata> {
  const { floorId } = await params;
  const { branchId } = await searchParams;
  const context = await getFloorDetailContext(branchId ?? "", floorId);
  return { title: context.floor?.name ?? "Floor Details" };
}

export default async function FloorDetailsPage({ params, searchParams }: FloorDetailsPageProps) {
  const { floorId } = await params;
  const { branchId } = await searchParams;
  const context = await getFloorDetailContext(branchId ?? "", floorId);

  if (!context.floor || !context.selectedBranchId) {
    notFound();
  }

  return (
    <ApplicationPageTemplate
      title={context.floor.name}
      description="Floor designer, table layout, and floor management actions."
      icon={Grid3X3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Floors & tables",
          href: FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(context.selectedBranchId),
        },
        { label: context.floor.name },
      ]}
    >
      <FloorDetailsPanel context={context} floor={context.floor} tables={context.tables} />
    </ApplicationPageTemplate>
  );
}
