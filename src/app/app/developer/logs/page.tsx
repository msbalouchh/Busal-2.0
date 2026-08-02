import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperLogsPanel } from "@/modules/developer-platform-management/components/developer-logs-panel";
import { getDeveloperLogsContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Request Logs" };
}

export default async function DeveloperLogsPage() {
  const context = await getDeveloperLogsContext();

  return (
    <ApplicationPageTemplate
      title="Request Logs"
      description="Review API request history."
      icon={ScrollText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Logs" },
      ]}
    >
      <DeveloperLogsPanel logs={context.logs} />
    </ApplicationPageTemplate>
  );
}
