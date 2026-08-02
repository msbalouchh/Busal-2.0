import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ExecutionHistoryPanel } from "@/modules/ai-orchestrator-management/components/execution-history-panel";
import { getWorkflowExecutionsContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Execution History" };
}

export default async function AiOrchestratorExecutionsPage() {
  const context = await getWorkflowExecutionsContext();

  return (
    <ApplicationPageTemplate
      title="Execution History"
      description="Review workflow execution history."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Executions" },
      ]}
    >
      <ExecutionHistoryPanel context={context} executions={context.executions} />
    </ApplicationPageTemplate>
  );
}
