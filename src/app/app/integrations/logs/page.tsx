import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationLogsPanel } from "@/modules/integration-platform-management/components/integration-logs-panel";
import { getIntegrationLogsContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Integration Logs | Integrations" };
}

export default async function IntegrationLogsPage() {
  const context = await getIntegrationLogsContext();

  return (
    <ApplicationPageTemplate
      title="Integration Logs"
      description="Audit trail for integration activity."
      icon={ScrollText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Logs" },
      ]}
    >
      <IntegrationLogsPanel logs={context.logs} />
    </ApplicationPageTemplate>
  );
}
