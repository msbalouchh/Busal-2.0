import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingAgentDashboardPanel } from "@/modules/ai-marketing-agent-management/components/marketing-agent-dashboard-panel";
import { getMarketingAgentDashboardContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Marketing Agent" };
}

export default async function AiMarketingAgentDashboardPage() {
  const context = await getMarketingAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Marketing Agent"
      description="Campaign insights, audience analytics, and promotion recommendations."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent" },
      ]}
    >
      <MarketingAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        promotions={context.promotions}
        segments={context.segments}
        audience={context.audience}
        campaigns={context.campaigns}
      />
    </ApplicationPageTemplate>
  );
}
