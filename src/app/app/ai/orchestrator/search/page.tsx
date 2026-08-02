import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { WorkflowSearchPanel } from "@/modules/ai-orchestrator-management/components/workflow-search-panel";
import { getWorkflowSearchContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Search" };
}

export default async function AiOrchestratorSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getWorkflowSearchContext({ search: params.search, pageSize: 24 });

  return (
    <ApplicationPageTemplate
      title="Workflow Search"
      description="Search orchestrator workflows."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Search" },
      ]}
    >
      <WorkflowSearchPanel context={context} results={context.results} query={context.query} />
    </ApplicationPageTemplate>
  );
}
