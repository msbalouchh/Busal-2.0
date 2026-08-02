import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationLogsPanel } from "@/modules/communication-platform-management/components/communication-logs-panel";
import { getCommunicationLogsContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Delivery Logs" };
}

export default async function CommunicationsLogsPage() {
  const context = await getCommunicationLogsContext();

  return (
    <ApplicationPageTemplate
      title="Delivery Logs"
      description="Track message delivery and retry failures."
      icon={ScrollText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Logs" },
      ]}
    >
      <CommunicationLogsPanel context={context} messages={context.messages} />
    </ApplicationPageTemplate>
  );
}
