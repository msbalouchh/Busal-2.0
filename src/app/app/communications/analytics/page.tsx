import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationAnalyticsPanel } from "@/modules/communication-platform-management/components/communication-analytics-panel";
import { getCommunicationAnalyticsContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Analytics" };
}

export default async function CommunicationsAnalyticsPage() {
  const context = await getCommunicationAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Analytics"
      description="Communication delivery and engagement metrics."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Analytics" },
      ]}
    >
      <CommunicationAnalyticsPanel analytics={context.analytics} />
    </ApplicationPageTemplate>
  );
}
