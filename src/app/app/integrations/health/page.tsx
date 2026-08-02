import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationHealthPanel } from "@/modules/integration-platform-management/components/integration-health-panel";
import { getIntegrationHealthContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Integration Health | Integrations" };
}

export default async function IntegrationHealthPage() {
  const context = await getIntegrationHealthContext();

  return (
    <ApplicationPageTemplate
      title="Health Dashboard"
      description="Integration platform health and error monitoring."
      icon={HeartPulse}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Health" },
      ]}
    >
      <IntegrationHealthPanel health={context.health} />
    </ApplicationPageTemplate>
  );
}
