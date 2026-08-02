import type { Metadata } from "next";
import { Play } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationActionsPanel } from "@/modules/automation-platform-management/components/automation-actions-panel";
import { getAutomationActionsContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Action Library" };
}

export default async function AutomationActionsPage() {
  const context = await getAutomationActionsContext();

  return (
    <ApplicationPageTemplate
      title="Action Library"
      description="Browse supported automation actions."
      icon={Play}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Actions" },
      ]}
    >
      <AutomationActionsPanel actions={context.actions} />
    </ApplicationPageTemplate>
  );
}
