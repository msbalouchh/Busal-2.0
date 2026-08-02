import type { Metadata } from "next";
import { Bell } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityAlertsPanel } from "@/modules/observability-platform-management/components/observability-alerts-panel";
import { getObservabilityAlertsContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Alerts" };
}

export default async function ObservabilityAlertsPage() {
  const context = await getObservabilityAlertsContext();

  return (
    <ApplicationPageTemplate
      title="Alerts"
      description="Monitor and manage platform alert rules."
      icon={Bell}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Alerts" },
      ]}
    >
      <ObservabilityAlertsPanel context={context} alerts={context.alerts} />
    </ApplicationPageTemplate>
  );
}
