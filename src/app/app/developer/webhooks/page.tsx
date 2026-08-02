import type { Metadata } from "next";
import { Webhook } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperWebhooksPanel } from "@/modules/developer-platform-management/components/developer-webhooks-panel";
import { getDeveloperWebhooksContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Webhooks" };
}

export default async function DeveloperWebhooksPage() {
  const context = await getDeveloperWebhooksContext();

  return (
    <ApplicationPageTemplate
      title="Webhooks"
      description="Manage webhook subscriptions and delivery."
      icon={Webhook}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Webhooks" },
      ]}
    >
      <DeveloperWebhooksPanel
        context={context}
        webhooks={context.webhooks}
        applications={context.applications}
      />
    </ApplicationPageTemplate>
  );
}
