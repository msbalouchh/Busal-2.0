import type { Metadata } from "next";
import { Terminal } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperExplorerPanel } from "@/modules/developer-platform-management/components/developer-explorer-panel";
import { getDeveloperExplorerContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "API Explorer" };
}

export default async function DeveloperExplorerPage() {
  const context = await getDeveloperExplorerContext();

  return (
    <ApplicationPageTemplate
      title="API Explorer"
      description="Explore and simulate API requests."
      icon={Terminal}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Explorer" },
      ]}
    >
      <DeveloperExplorerPanel routes={context.routes} />
    </ApplicationPageTemplate>
  );
}
