import type { Metadata } from "next";
import { Zap } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationTriggersPanel } from "@/modules/automation-platform-management/components/automation-triggers-panel";
import { getAutomationTriggersContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Trigger Library" };
}

export default async function AutomationTriggersPage() {
  const context = await getAutomationTriggersContext();

  return (
    <ApplicationPageTemplate
      title="Trigger Library"
      description="Browse supported automation triggers."
      icon={Zap}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Triggers" },
      ]}
    >
      <AutomationTriggersPanel triggers={context.triggers} />
    </ApplicationPageTemplate>
  );
}
