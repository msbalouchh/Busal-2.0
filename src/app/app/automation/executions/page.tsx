import type { Metadata } from "next";
import { History } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationExecutionsPanel } from "@/modules/automation-platform-management/components/automation-executions-panel";
import { getAutomationExecutionsContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Execution History" };
}

export default async function AutomationExecutionsPage() {
  const context = await getAutomationExecutionsContext();

  return (
    <ApplicationPageTemplate
      title="Execution History"
      description="Monitor workflow runs and retry failures."
      icon={History}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Executions" },
      ]}
    >
      <AutomationExecutionsPanel
        context={context}
        executions={context.executions}
        history={context.history}
      />
    </ApplicationPageTemplate>
  );
}
