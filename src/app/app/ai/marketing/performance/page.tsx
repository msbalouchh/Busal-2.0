import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingPerformancePanel } from "@/modules/ai-marketing-agent-management/components/marketing-performance-panel";
import { getMarketingPerformanceContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Campaign Performance" };
}

export default async function AiMarketingPerformancePage() {
  const context = await getMarketingPerformanceContext();

  return (
    <ApplicationPageTemplate
      title="Campaign Performance"
      description="Revenue trends, retention, engagement, and campaign metrics."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Performance" },
      ]}
    >
      <MarketingPerformancePanel
        campaigns={context.campaigns}
        trends={context.trends}
        retention={context.retention}
        engagement={context.engagement}
      />
    </ApplicationPageTemplate>
  );
}
