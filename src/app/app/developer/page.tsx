import type { Metadata } from "next";
import { Code2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperDashboardPanel } from "@/modules/developer-platform-management/components/developer-dashboard-panel";
import { getDeveloperDashboardContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Developer" };
}

export default async function DeveloperDashboardPage() {
  const context = await getDeveloperDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Developer"
      description="Build integrations with Busal OS APIs."
      icon={Code2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer" },
      ]}
    >
      <DeveloperDashboardPanel
        context={context}
        summary={context.summary}
        applications={context.applications}
      />
    </ApplicationPageTemplate>
  );
}
