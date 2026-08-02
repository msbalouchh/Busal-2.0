import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsWorkflowsPanel } from "@/modules/ai-operations-agent-management/components/operations-workflows-panel";
import { getOperationsWorkflowsContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Analytics | AI Operations Agent" };
}

export default async function AiOperationsWorkflowsPage() {
  const context = await getOperationsWorkflowsContext();

  return (
    <ApplicationPageTemplate
      title="Workflow Analytics"
      description="Order flow, peak hours, and workflow performance."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Workflows" },
      ]}
    >
      <OperationsWorkflowsPanel workflow={context.workflow} />
    </ApplicationPageTemplate>
  );
}
