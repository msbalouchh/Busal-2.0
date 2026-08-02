import type { Metadata } from "next";
import { Workflow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationDashboardPanel } from "@/modules/automation-platform-management/components/automation-dashboard-panel";
import { getAutomationDashboardContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Automation" };
}

export default async function AutomationDashboardPage() {
  const context = await getAutomationDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Automation"
      description="Automate business processes with triggers, conditions, and actions."
      icon={Workflow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation" },
      ]}
    >
      <AutomationDashboardPanel
        context={context}
        summary={context.summary}
        history={context.history}
        workflows={context.workflows}
        logs={context.logs}
      />
    </ApplicationPageTemplate>
  );
}
