import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesInsightsPanel } from "@/modules/ai-sales-agent-management/components/sales-insights-panel";
import { getSalesInsightsContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sales Insights" };
}

export default async function AiSalesInsightsPage() {
  const context = await getSalesInsightsContext({ status: "ACTIVE" });

  return (
    <ApplicationPageTemplate
      title="Sales Insights"
      description="AI-generated insights across revenue, pipeline, and customers."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent", href: "/app/ai/sales" },
        { label: "Insights" },
      ]}
    >
      <SalesInsightsPanel context={context} insights={context.insights} />
    </ApplicationPageTemplate>
  );
}
