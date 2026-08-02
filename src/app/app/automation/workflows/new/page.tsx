import type { Metadata } from "next";
import { Workflow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationWorkflowBuilderPanel } from "@/modules/automation-platform-management/components/automation-workflow-builder-panel";
import { getAutomationWorkflowBuilderContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New Workflow" };
}

export default async function AutomationWorkflowNewPage() {
  const context = await getAutomationWorkflowBuilderContext();

  return (
    <ApplicationPageTemplate
      title="Workflow Builder"
      description="Create a new automation workflow."
      icon={Workflow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Workflows", href: AUTOMATION_PLATFORM_ROUTES.workflows() },
        { label: "New" },
      ]}
    >
      <AutomationWorkflowBuilderPanel context={context} />
    </ApplicationPageTemplate>
  );
}
