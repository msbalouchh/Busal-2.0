import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingTimelinePanel } from "@/modules/ai-marketing-agent-management/components/marketing-timeline-panel";
import { getMarketingTimelineContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Marketing Timeline" };
}

export default async function AiMarketingTimelinePage() {
  const context = await getMarketingTimelineContext();

  return (
    <ApplicationPageTemplate
      title="Marketing Timeline"
      description="Chronological view of insights and campaign activity."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Timeline" },
      ]}
    >
      <MarketingTimelinePanel timeline={context.timeline} />
    </ApplicationPageTemplate>
  );
}
