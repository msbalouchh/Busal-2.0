import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesRevenuePanel } from "@/modules/ai-sales-agent-management/components/sales-revenue-panel";
import { getSalesRevenueContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Revenue Insights" };
}

export default async function AiSalesRevenuePage() {
  const context = await getSalesRevenueContext();

  return (
    <ApplicationPageTemplate
      title="Revenue Insights"
      description="Revenue trends, forecasts, and quote analysis."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent", href: "/app/ai/sales" },
        { label: "Revenue" },
      ]}
    >
      <SalesRevenuePanel
        revenue={context.revenue}
        trend={context.trend}
        forecast={context.forecast}
        quotes={context.quotes}
      />
    </ApplicationPageTemplate>
  );
}
