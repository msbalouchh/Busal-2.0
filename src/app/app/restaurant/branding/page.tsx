import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { RestaurantBrandingForm } from "@/modules/restaurant-management/components/restaurant-branding-form";
import {
  getRestaurantManagementContext,
  RESTAURANT_MANAGEMENT_ROUTES,
} from "@/modules/restaurant-management/lib/get-restaurant-management-context";

export const metadata: Metadata = {
  title: "Restaurant Branding",
};

export default async function RestaurantBrandingPage() {
  const context = await getRestaurantManagementContext();

  if (!context.permissionsFlags.canManageBranding) {
    redirect(RESTAURANT_MANAGEMENT_ROUTES.dashboard);
  }

  return (
    <ApplicationPageTemplate
      title="Restaurant branding"
      description="Logo, colours, receipt footer, and social presence."
      icon={Palette}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Branding" },
      ]}
    >
      <RestaurantBrandingForm
        branding={context.bundle.branding}
        disabled={!context.permissionsFlags.canManageBranding}
      />
    </ApplicationPageTemplate>
  );
}
