import type { Metadata } from "next";
import { Activity } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityDashboardPanel } from "@/modules/observability-platform-management/components/observability-dashboard-panel";
import { getObservabilityDashboardContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Observability" };
}

export default async function ObservabilityDashboardPage() {
  const context = await getObservabilityDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Observability"
      description="Enterprise monitoring across the Busal ecosystem."
      icon={Activity}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability" },
      ]}
    >
      <ObservabilityDashboardPanel
        context={context}
        summary={context.summary}
        serviceHealth={context.serviceHealth}
        recentMetrics={context.recentMetrics}
      />
    </ApplicationPageTemplate>
  );
}
