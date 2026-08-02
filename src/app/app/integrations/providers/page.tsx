import type { Metadata } from "next";
import { Store } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationProvidersPanel } from "@/modules/integration-platform-management/components/integration-providers-panel";
import { getIntegrationProvidersContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Provider Marketplace | Integrations" };
}

export default async function IntegrationProvidersPage() {
  const context = await getIntegrationProvidersContext();

  return (
    <ApplicationPageTemplate
      title="Provider Marketplace"
      description="Browse available integration providers."
      icon={Store}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Providers" },
      ]}
    >
      <IntegrationProvidersPanel context={context} providers={context.providers} />
    </ApplicationPageTemplate>
  );
}
