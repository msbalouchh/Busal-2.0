import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationChannelsPanel } from "@/modules/communication-platform-management/components/communication-channels-panel";
import { getCommunicationChannelsContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Channel Settings" };
}

export default async function CommunicationsChannelsPage() {
  const context = await getCommunicationChannelsContext();

  return (
    <ApplicationPageTemplate
      title="Channel Settings"
      description="Configure communication channels and provider placeholders."
      icon={Settings}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Channels" },
      ]}
    >
      <CommunicationChannelsPanel
        context={context}
        channels={context.channels}
        providers={context.providers}
      />
    </ApplicationPageTemplate>
  );
}
