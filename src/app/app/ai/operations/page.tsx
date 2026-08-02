import type { Metadata } from "next";
import { Cog } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsAgentDashboardPanel } from "@/modules/ai-operations-agent-management/components/operations-agent-dashboard-panel";
import { getOperationsAgentDashboardContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Operations Agent" };
}

export default async function AiOperationsAgentDashboardPage() {
  const context = await getOperationsAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Operations Agent"
      description="Operational health, workflow insights, and efficiency recommendations."
      icon={Cog}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent" },
      ]}
    >
      <OperationsAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        recommendations={context.recommendations}
        health={context.health}
        bottlenecks={context.bottlenecks}
        risks={context.risks}
        trends={context.trends}
      />
    </ApplicationPageTemplate>
  );
}
