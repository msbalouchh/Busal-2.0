import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationSyncPanel } from "@/modules/integration-platform-management/components/integration-sync-panel";
import { getIntegrationSyncContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sync Monitor | Integrations" };
}

export default async function IntegrationSyncPage() {
  const context = await getIntegrationSyncContext();

  return (
    <ApplicationPageTemplate
      title="Sync Monitor"
      description="Monitor and retry integration sync jobs."
      icon={RefreshCw}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Sync" },
      ]}
    >
      <IntegrationSyncPanel context={context} syncJobs={context.syncJobs} />
    </ApplicationPageTemplate>
  );
}
