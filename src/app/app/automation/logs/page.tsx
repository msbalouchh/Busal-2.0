import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationLogsPanel } from "@/modules/automation-platform-management/components/automation-logs-panel";
import { getAutomationLogsContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Automation Logs" };
}

export default async function AutomationLogsPage() {
  const context = await getAutomationLogsContext();

  return (
    <ApplicationPageTemplate
      title="Logs"
      description="View automation execution logs."
      icon={ScrollText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Logs" },
      ]}
    >
      <AutomationLogsPanel logs={context.logs} />
    </ApplicationPageTemplate>
  );
}
