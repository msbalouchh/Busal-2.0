import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationTemplatesPanel } from "@/modules/communication-platform-management/components/communication-templates-panel";
import { getCommunicationTemplatesContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";
import { COMMUNICATION_PLATFORM_ROUTES } from "@/modules/communication-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Templates" };
}

export default async function CommunicationsTemplatesPage() {
  const context = await getCommunicationTemplatesContext();

  return (
    <ApplicationPageTemplate
      title="Templates"
      description="Build and manage communication templates."
      icon={FileText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications", href: COMMUNICATION_PLATFORM_ROUTES.dashboard() },
        { label: "Templates" },
      ]}
    >
      <CommunicationTemplatesPanel context={context} templates={context.templates} />
    </ApplicationPageTemplate>
  );
}
