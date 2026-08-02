import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { RestaurantPreferencesForm } from "@/modules/restaurant-management/components/restaurant-preferences-form";
import {
  getRestaurantManagementContext,
  RESTAURANT_MANAGEMENT_ROUTES,
} from "@/modules/restaurant-management/lib/get-restaurant-management-context";

export const metadata: Metadata = {
  title: "Restaurant Preferences",
};

export default async function RestaurantPreferencesPage() {
  const context = await getRestaurantManagementContext();

  if (!context.permissionsFlags.canUpdate) {
    redirect(RESTAURANT_MANAGEMENT_ROUTES.dashboard);
  }

  return (
    <ApplicationPageTemplate
      title="Restaurant preferences"
      description="Service modes, reservations, and service charge preferences."
      icon={SlidersHorizontal}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Preferences" },
      ]}
    >
      <RestaurantPreferencesForm
        settings={context.bundle.settings}
        disabled={!context.permissionsFlags.canUpdate}
      />
    </ApplicationPageTemplate>
  );
}
