import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { TaskTimelinePanel } from "@/modules/ai-orchestrator-management/components/task-timeline-panel";
import { getWorkflowTimelineContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Task Timeline" };
}

export default async function AiOrchestratorTimelinePage() {
  const context = await getWorkflowTimelineContext();

  return (
    <ApplicationPageTemplate
      title="Task Timeline"
      description="Chronological view of workflow executions."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Orchestrator", href: "/app/ai/orchestrator" },
        { label: "Timeline" },
      ]}
    >
      <TaskTimelinePanel context={context} timeline={context.timeline} />
    </ApplicationPageTemplate>
  );
}
