import type { Metadata } from "next";
import { Workflow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationWorkflowDetailPanel } from "@/modules/automation-platform-management/components/automation-workflow-detail-panel";
import { getAutomationWorkflowDetailContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Detail" };
}

export default async function AutomationWorkflowDetailPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const context = await getAutomationWorkflowDetailContext(workflowId);

  return (
    <ApplicationPageTemplate
      title={context.workflow.name}
      description="Configure triggers, conditions, and actions."
      icon={Workflow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Workflows", href: AUTOMATION_PLATFORM_ROUTES.workflows() },
        { label: context.workflow.name },
      ]}
    >
      <AutomationWorkflowDetailPanel context={context} workflow={context.workflow} />
    </ApplicationPageTemplate>
  );
}
