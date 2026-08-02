import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportAgentDashboardPanel } from "@/modules/ai-support-agent-management/components/support-agent-dashboard-panel";
import { getSupportAgentDashboardContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Support Agent" };
}

export default async function AiSupportAgentDashboardPage() {
  const context = await getSupportAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Support Agent"
      description="Ticket insights, response suggestions, and customer satisfaction analysis."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent" },
      ]}
    >
      <SupportAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        recommendations={context.recommendations}
        tickets={context.tickets}
        satisfaction={context.satisfaction}
      />
    </ApplicationPageTemplate>
  );
}
