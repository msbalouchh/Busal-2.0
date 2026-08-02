import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationTemplatesPanel } from "@/modules/automation-platform-management/components/automation-templates-panel";
import { getAutomationTemplatesContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Workflow Templates" };
}

export default async function AutomationTemplatesPage() {
  const context = await getAutomationTemplatesContext();

  return (
    <ApplicationPageTemplate
      title="Templates"
      description="Start from pre-built workflow templates."
      icon={LayoutTemplate}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Templates" },
      ]}
    >
      <AutomationTemplatesPanel context={context} templates={context.templates} />
    </ApplicationPageTemplate>
  );
}
