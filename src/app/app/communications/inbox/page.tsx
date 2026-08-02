import type { Metadata } from "next";
import { Inbox } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationInboxPanel } from "@/modules/communication-platform-management/components/communication-inbox-panel";
import { getCommunicationInboxContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Unified Inbox" };
}

export default async function CommunicationsInboxPage() {
  const context = await getCommunicationInboxContext();

  return (
    <ApplicationPageTemplate
      title="Unified Inbox"
      description="View and send messages across all channels."
      icon={Inbox}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Inbox" },
      ]}
    >
      <CommunicationInboxPanel context={context} messages={context.messages} />
    </ApplicationPageTemplate>
  );
}
