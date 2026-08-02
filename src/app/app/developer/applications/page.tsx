import type { Metadata } from "next";
import { AppWindow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperApplicationsPanel } from "@/modules/developer-platform-management/components/developer-applications-panel";
import { getDeveloperApplicationsContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "API Applications" };
}

export default async function DeveloperApplicationsPage() {
  const context = await getDeveloperApplicationsContext();

  return (
    <ApplicationPageTemplate
      title="API Applications"
      description="Manage API applications and client credentials."
      icon={AppWindow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Applications" },
      ]}
    >
      <DeveloperApplicationsPanel context={context} applications={context.applications} />
    </ApplicationPageTemplate>
  );
}
