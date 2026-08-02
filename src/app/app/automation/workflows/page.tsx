import type { Metadata } from "next";
import { Workflow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationWorkflowListPanel } from "@/modules/automation-platform-management/components/automation-workflow-list-panel";
import { getAutomationWorkflowsContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflows" };
}

export default async function AutomationWorkflowsPage() {
  const context = await getAutomationWorkflowsContext();

  return (
    <ApplicationPageTemplate
      title="Workflows"
      description="View and manage automation workflows."
      icon={Workflow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Workflows" },
      ]}
    >
      <AutomationWorkflowListPanel context={context} workflows={context.workflows} />
    </ApplicationPageTemplate>
  );
}
