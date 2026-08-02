import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingAudiencePanel } from "@/modules/ai-marketing-agent-management/components/marketing-audience-panel";
import { getMarketingAudienceContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Audience Analytics" };
}

export default async function AiMarketingAudiencePage() {
  const context = await getMarketingAudienceContext();

  return (
    <ApplicationPageTemplate
      title="Audience Analytics"
      description="Customer acquisition, retention, and loyalty campaign targets."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Audience" },
      ]}
    >
      <MarketingAudiencePanel audience={context.audience} loyaltyTargets={context.loyaltyTargets} />
    </ApplicationPageTemplate>
  );
}
