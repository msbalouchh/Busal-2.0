import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OrchestratorDashboardPanel } from "@/modules/ai-orchestrator-management/components/orchestrator-dashboard-panel";
import { getOrchestratorDashboardContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Orchestrator" };
}

export default async function AiOrchestratorDashboardPage() {
  const context = await getOrchestratorDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Orchestrator"
      description="Plan, route, execute, and monitor multi-agent workflows."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator" },
      ]}
    >
      <OrchestratorDashboardPanel
        context={context}
        stats={context.stats}
        recent={context.recent}
        monitor={context.monitor}
        templates={context.templates}
      />
    </ApplicationPageTemplate>
  );
}
