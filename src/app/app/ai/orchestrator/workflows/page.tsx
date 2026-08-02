import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import type { WorkflowStatus } from "@prisma/client";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { WorkflowListPanel } from "@/modules/ai-orchestrator-management/components/workflow-list-panel";
import { getWorkflowListContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow List" };
}

export default async function AiOrchestratorWorkflowsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getWorkflowListContext({
    search: params.search,
    status: (params.status as WorkflowStatus | "ALL") ?? "ALL",
    pageSize: 24,
  });

  return (
    <ApplicationPageTemplate
      title="Workflow List"
      description="Browse and manage orchestrator workflows."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Workflows" },
      ]}
    >
      <WorkflowListPanel context={context} list={context.list} />
    </ApplicationPageTemplate>
  );
}
