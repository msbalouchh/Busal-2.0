import type { Metadata } from "next";
import { ChefHat } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { KitchenDashboardPanel } from "@/modules/kitchen-display-management/components/kitchen-dashboard-panel";
import { getKitchenDashboardContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface KitchenPageProps {
  searchParams: Promise<{ branchId?: string; stationId?: string; search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kitchen Display" };
}

export default async function KitchenDisplayPage({ searchParams }: KitchenPageProps) {
  const params = await searchParams;
  const context = await getKitchenDashboardContext(
    params.branchId ?? "",
    params.stationId,
    params.search,
  );

  return (
    <ApplicationPageTemplate
      title="Kitchen Display"
      description="Real-time kitchen queue powered by Order Management."
      icon={ChefHat}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Kitchen" },
      ]}
    >
      <KitchenDashboardPanel
        context={context}
        queue={context.queue}
        stats={context.stats}
        stations={context.stations}
        initialStationId={params.stationId ?? ""}
        initialSearch={params.search ?? ""}
      />
    </ApplicationPageTemplate>
  );
}
