import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SavedReportsPanel } from "@/modules/restaurant-analytics-management/components/saved-reports-panel";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { getSavedReportsContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Saved Reports" };
}

export default async function SavedReportsPage() {
  const context = await getSavedReportsContext();

  return (
    <ApplicationPageTemplate
      title="Saved Reports"
      description="Access and manage your saved custom reports."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "Analytics", href: RESTAURANT_ANALYTICS_ROUTES.dashboard() },
        { label: "Reports" },
      ]}
    >
      <SavedReportsPanel context={context} reports={context.reports} />
    </ApplicationPageTemplate>
  );
}
