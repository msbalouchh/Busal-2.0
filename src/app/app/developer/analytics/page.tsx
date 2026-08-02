import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperAnalyticsPanel } from "@/modules/developer-platform-management/components/developer-analytics-panel";
import { getDeveloperAnalyticsContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Usage Analytics" };
}

export default async function DeveloperAnalyticsPage() {
  const context = await getDeveloperAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Usage Analytics"
      description="Monitor API usage and performance."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Analytics" },
      ]}
    >
      <DeveloperAnalyticsPanel analytics={context.analytics} />
    </ApplicationPageTemplate>
  );
}
