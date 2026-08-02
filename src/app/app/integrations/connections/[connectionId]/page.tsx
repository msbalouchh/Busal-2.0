import type { Metadata } from "next";
import { Link2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationConnectionDetailPanel } from "@/modules/integration-platform-management/components/integration-connection-detail-panel";
import { getIntegrationConnectionDetailContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Connection Details | Integrations" };
}

interface IntegrationConnectionDetailPageProps {
  params: Promise<{ connectionId: string }>;
}

export default async function IntegrationConnectionDetailPage({
  params,
}: IntegrationConnectionDetailPageProps) {
  const { connectionId } = await params;
  const context = await getIntegrationConnectionDetailContext(connectionId);

  return (
    <ApplicationPageTemplate
      title="Connection Details"
      description="Test, sync, and manage this integration connection."
      icon={Link2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Connections", href: "/app/integrations/connections" },
        { label: "Details" },
      ]}
    >
      <IntegrationConnectionDetailPanel
        context={context}
        connection={context.connection}
        logs={context.logs}
      />
    </ApplicationPageTemplate>
  );
}
