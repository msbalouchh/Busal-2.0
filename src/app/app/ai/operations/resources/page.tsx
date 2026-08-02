import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsResourcesPanel } from "@/modules/ai-operations-agent-management/components/operations-resources-panel";
import { getOperationsResourcesContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Resource Analytics | AI Operations Agent" };
}

export default async function AiOperationsResourcesPage() {
  const context = await getOperationsResourcesContext();

  return (
    <ApplicationPageTemplate
      title="Resource Analytics"
      description="Staff utilization, inventory health, and resource optimization."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Resources" },
      ]}
    >
      <OperationsResourcesPanel resources={context.resources} inventory={context.inventory} />
    </ApplicationPageTemplate>
  );
}
