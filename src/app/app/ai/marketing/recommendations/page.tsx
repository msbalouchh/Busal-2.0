import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingRecommendationsPanel } from "@/modules/ai-marketing-agent-management/components/marketing-recommendations-panel";
import { getMarketingRecommendationsContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Marketing Recommendations" };
}

export default async function AiMarketingRecommendationsPage() {
  const context = await getMarketingRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Promotion Suggestions"
      description="AI-generated promotion and campaign recommendations."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Recommendations" },
      ]}
    >
      <MarketingRecommendationsPanel recommendations={context.recommendations} />
    </ApplicationPageTemplate>
  );
}
