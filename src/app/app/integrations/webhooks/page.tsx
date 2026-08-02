import type { Metadata } from "next";
import { Webhook } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationWebhooksPanel } from "@/modules/integration-platform-management/components/integration-webhooks-panel";
import { getIntegrationWebhooksContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Webhooks | Integrations" };
}

export default async function IntegrationWebhooksPage() {
  const context = await getIntegrationWebhooksContext();

  return (
    <ApplicationPageTemplate
      title="Webhook Manager"
      description="Register and manage integration webhooks."
      icon={Webhook}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Webhooks" },
      ]}
    >
      <IntegrationWebhooksPanel
        context={context}
        webhooks={context.webhooks}
        providers={context.providers}
      />
    </ApplicationPageTemplate>
  );
}
