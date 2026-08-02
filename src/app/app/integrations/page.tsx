import type { Metadata } from "next";
import { Plug } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationDashboardPanel } from "@/modules/integration-platform-management/components/integration-dashboard-panel";
import { getIntegrationDashboardContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Integrations" };
}

export default async function IntegrationsDashboardPage() {
  const context = await getIntegrationDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Integrations"
      description="Connect external systems with the Busal Integration Platform."
      icon={Plug}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations" },
      ]}
    >
      <IntegrationDashboardPanel
        context={context}
        health={context.health}
        providers={context.providers}
        connections={context.connections}
        webhooks={context.webhooks}
        syncJobs={context.syncJobs}
        logs={context.logs}
      />
    </ApplicationPageTemplate>
  );
}
