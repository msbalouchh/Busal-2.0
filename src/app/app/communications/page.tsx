import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CommunicationDashboardPanel } from "@/modules/communication-platform-management/components/communication-dashboard-panel";
import { getCommunicationDashboardContext } from "@/modules/communication-platform-management/lib/get-communication-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Communications" };
}

export default async function CommunicationsDashboardPage() {
  const context = await getCommunicationDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Communications"
      description="Centralized communication engine for all business messaging."
      icon={MessageSquare}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Communications" },
      ]}
    >
      <CommunicationDashboardPanel
        context={context}
        analytics={context.analytics}
        messages={context.messages}
      />
    </ApplicationPageTemplate>
  );
}
