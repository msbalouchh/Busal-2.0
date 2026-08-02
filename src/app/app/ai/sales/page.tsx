import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesAgentDashboardPanel } from "@/modules/ai-sales-agent-management/components/sales-agent-dashboard-panel";
import { getSalesAgentDashboardContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Sales Agent" };
}

export default async function AiSalesAgentDashboardPage() {
  const context = await getSalesAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Sales Agent"
      description="Revenue insights, pipeline analysis, and sales recommendations."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent" },
      ]}
    >
      <SalesAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        recommendations={context.recommendations}
        opportunities={context.opportunities}
        revenue={context.revenue}
        pipeline={context.pipeline}
      />
    </ApplicationPageTemplate>
  );
}
