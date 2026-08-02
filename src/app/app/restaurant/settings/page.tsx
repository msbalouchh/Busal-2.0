import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { RestaurantSettingsForm } from "@/modules/restaurant-management/components/restaurant-settings-form";
import {
  getRestaurantManagementContext,
  RESTAURANT_MANAGEMENT_ROUTES,
} from "@/modules/restaurant-management/lib/get-restaurant-management-context";

export const metadata: Metadata = {
  title: "Restaurant Settings",
};

export default async function RestaurantSettingsPage() {
  const context = await getRestaurantManagementContext();

  if (!context.permissionsFlags.canManageSettings) {
    redirect(RESTAURANT_MANAGEMENT_ROUTES.dashboard);
  }

  return (
    <ApplicationPageTemplate
      title="Restaurant settings"
      description="Compliance, tax, currency, and default branch configuration."
      icon={Settings2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Settings" },
      ]}
    >
      <RestaurantSettingsForm
        settings={context.bundle.settings}
        branches={context.branches}
        disabled={!context.permissionsFlags.canManageSettings}
      />
    </ApplicationPageTemplate>
  );
}
