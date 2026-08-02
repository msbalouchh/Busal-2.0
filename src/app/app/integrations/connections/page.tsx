import type { Metadata } from "next";
import { Link2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationConnectionsPanel } from "@/modules/integration-platform-management/components/integration-connections-panel";
import { getIntegrationConnectionsContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Connected Apps | Integrations" };
}

export default async function IntegrationConnectionsPage() {
  const context = await getIntegrationConnectionsContext();

  return (
    <ApplicationPageTemplate
      title="Connected Apps"
      description="Manage active integration connections."
      icon={Link2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Connections" },
      ]}
    >
      <IntegrationConnectionsPanel context={context} connections={context.connections} />
    </ApplicationPageTemplate>
  );
}
