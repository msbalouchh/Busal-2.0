import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingInsightsPanel } from "@/modules/ai-marketing-agent-management/components/marketing-insights-panel";
import { getMarketingInsightsContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Marketing Insights" };
}

export default async function AiMarketingInsightsPage() {
  const context = await getMarketingInsightsContext({ status: "ACTIVE" });

  return (
    <ApplicationPageTemplate
      title="Marketing Insights"
      description="AI-generated campaign, audience, and retention insights."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Insights" },
      ]}
    >
      <MarketingInsightsPanel context={context} insights={context.insights} />
    </ApplicationPageTemplate>
  );
}
