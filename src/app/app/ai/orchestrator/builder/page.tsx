import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { WorkflowBuilderPanel } from "@/modules/ai-orchestrator-management/components/workflow-builder-panel";
import { getWorkflowBuilderContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Builder" };
}

export default async function AiOrchestratorBuilderPage() {
  const context = await getWorkflowBuilderContext();

  return (
    <ApplicationPageTemplate
      title="Workflow Builder"
      description="Build orchestrator workflows from templates."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Builder" },
      ]}
    >
      <WorkflowBuilderPanel context={context} templates={context.templates} />
    </ApplicationPageTemplate>
  );
}
