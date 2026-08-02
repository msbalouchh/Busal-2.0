import type { Metadata } from "next";
import { ChefHat } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { KitchenStationManager } from "@/modules/kitchen-display-management/components/kitchen-station-manager";
import { KITCHEN_DISPLAY_ROUTES } from "@/modules/kitchen-display-management/constants/routes";
import { getKitchenStationManagementContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface KitchenStationsPageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kitchen Stations" };
}

export default async function KitchenStationsPage({ searchParams }: KitchenStationsPageProps) {
  const params = await searchParams;
  const context = await getKitchenStationManagementContext(params.branchId ?? "");

  return (
    <ApplicationPageTemplate
      title="Kitchen stations"
      description="Configure stations and assign products for kitchen routing."
      icon={ChefHat}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        {
          label: "Kitchen",
          href: KITCHEN_DISPLAY_ROUTES.dashboardForBranch(context.selectedBranchId ?? ""),
        },
        { label: "Stations" },
      ]}
    >
      <KitchenStationManager
        context={context}
        stations={context.stations}
        products={context.products}
      />
    </ApplicationPageTemplate>
  );
}
