import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ExecutionMonitorPanel } from "@/modules/ai-orchestrator-management/components/execution-monitor-panel";
import { getWorkflowMonitorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Execution Monitor" };
}

export default async function AiOrchestratorMonitorPage() {
  const context = await getWorkflowMonitorContext();

  return (
    <ApplicationPageTemplate
      title="Execution Monitor"
      description="Monitor active workflow executions."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Monitor" },
      ]}
    >
      <ExecutionMonitorPanel context={context} monitor={context.monitor} active={context.active} />
    </ApplicationPageTemplate>
  );
}
