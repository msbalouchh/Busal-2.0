import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationCampaignsPanel } from "@/modules/communication-platform-management/components/communication-campaigns-panel";
import { getCommunicationCampaignsContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Campaigns" };
}

export default async function CommunicationsCampaignsPage() {
  const context = await getCommunicationCampaignsContext();

  return (
    <ApplicationPageTemplate
      title="Campaigns"
      description="Manage bulk and scheduled communication campaigns."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Campaigns" },
      ]}
    >
      <CommunicationCampaignsPanel context={context} campaigns={context.campaigns} />
    </ApplicationPageTemplate>
  );
}
