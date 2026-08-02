import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportAnalyticsPanel } from "@/modules/ai-support-agent-management/components/support-analytics-panel";
import { getSupportAnalyticsContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Support Analytics" };
}

export default async function AiSupportAnalyticsPage() {
  const context = await getSupportAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Support Analytics"
      description="Satisfaction scores, response times, and resolution analysis."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Analytics" },
      ]}
    >
      <SupportAnalyticsPanel
        satisfaction={context.satisfaction}
        tickets={context.tickets}
        dissatisfied={context.dissatisfied}
      />
    </ApplicationPageTemplate>
  );
}
