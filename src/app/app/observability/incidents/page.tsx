import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityIncidentsPanel } from "@/modules/observability-platform-management/components/observability-incidents-panel";
import { getObservabilityIncidentsContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Incidents" };
}

export default async function ObservabilityIncidentsPage() {
  const context = await getObservabilityIncidentsContext();

  return (
    <ApplicationPageTemplate
      title="Incidents"
      description="Manage and resolve platform incidents."
      icon={ShieldAlert}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Incidents" },
      ]}
    >
      <ObservabilityIncidentsPanel context={context} incidents={context.incidents} />
    </ApplicationPageTemplate>
  );
}
