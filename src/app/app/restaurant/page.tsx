import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { RestaurantDashboardPanel } from "@/modules/restaurant-management/components/restaurant-dashboard-panel";
import { getRestaurantManagementContext } from "@/modules/restaurant-management/lib/get-restaurant-management-context";

export const metadata: Metadata = {
  title: "Restaurant",
};

export default async function ApplicationRestaurantPage() {
  const context = await getRestaurantManagementContext();

  return (
    <ApplicationPageTemplate
      title="Restaurant"
      description="Configure restaurant capabilities, branding, and preferences for your business."
      icon={UtensilsCrossed}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant" },
      ]}
    >
      <RestaurantDashboardPanel context={context} />
    </ApplicationPageTemplate>
  );
}
