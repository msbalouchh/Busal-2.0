import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportInsightsPanel } from "@/modules/ai-support-agent-management/components/support-insights-panel";
import { getSupportInsightsContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Support Insights" };
}

export default async function AiSupportInsightsPage() {
  const context = await getSupportInsightsContext({ status: "ACTIVE" });

  return (
    <ApplicationPageTemplate
      title="Ticket Insights"
      description="AI-generated support insights and resolution recommendations."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Insights" },
      ]}
    >
      <SupportInsightsPanel context={context} insights={context.insights} />
    </ApplicationPageTemplate>
  );
}
