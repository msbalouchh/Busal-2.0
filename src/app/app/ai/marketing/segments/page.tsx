import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingSegmentsPanel } from "@/modules/ai-marketing-agent-management/components/marketing-segments-panel";
import { getMarketingSegmentsContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Customer Segments" };
}

export default async function AiMarketingSegmentsPage() {
  const context = await getMarketingSegmentsContext();

  return (
    <ApplicationPageTemplate
      title="Customer Segments"
      description="Segment analysis by group, lifetime value, and churn risk."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Segments" },
      ]}
    >
      <MarketingSegmentsPanel segments={context.segments} />
    </ApplicationPageTemplate>
  );
}
