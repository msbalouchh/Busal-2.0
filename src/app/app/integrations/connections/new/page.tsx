import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationConnectionWizard } from "@/modules/integration-platform-management/components/integration-connection-wizard";
import { getIntegrationConnectionWizardContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Connection | Integrations" };
}

export default async function IntegrationConnectionNewPage() {
  const context = await getIntegrationConnectionWizardContext();

  return (
    <ApplicationPageTemplate
      title="Connection Wizard"
      description="Create a new integration connection."
      icon={Plus}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Connections", href: "/app/integrations/connections" },
        { label: "New" },
      ]}
    >
      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading wizard…</p>}>
        <IntegrationConnectionWizard context={context} providers={context.providers} />
      </Suspense>
    </ApplicationPageTemplate>
  );
}
