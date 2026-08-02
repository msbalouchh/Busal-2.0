import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { WorkflowDetailPanel } from "@/modules/ai-orchestrator-management/components/workflow-detail-panel";
import { getWorkflowDetailContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Details" };
}

export default async function AiOrchestratorWorkflowDetailPage({ params }: PageProps) {
  const { workflowId } = await params;

  try {
    const context = await getWorkflowDetailContext(workflowId);

    return (
      <ApplicationPageTemplate
        title={context.workflow.name}
        description="Workflow steps, execution controls, and history."
        icon={GitBranch}
        breadcrumbs={[
          { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
          { label: "AI", href: "/app/ai" },
          { label: "Orchestrator", href: "/app/ai/orchestrator" },
          { label: "Workflows", href: "/app/ai/orchestrator/workflows" },
          { label: context.workflow.name },
        ]}
      >
        <WorkflowDetailPanel
          context={context}
          workflow={context.workflow}
          steps={context.steps}
          executions={context.executions}
        />
      </ApplicationPageTemplate>
    );
  } catch {
    notFound();
  }
}
