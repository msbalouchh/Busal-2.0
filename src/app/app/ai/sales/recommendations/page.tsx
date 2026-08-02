import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesRecommendationsPanel } from "@/modules/ai-sales-agent-management/components/sales-recommendations-panel";
import { getSalesRecommendationsContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sales Recommendations" };
}

export default async function AiSalesRecommendationsPage() {
  const context = await getSalesRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Sales Recommendations"
      description="Actionable upsell, cross-sell, and follow-up recommendations."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent", href: "/app/ai/sales" },
        { label: "Recommendations" },
      ]}
    >
      <SalesRecommendationsPanel context={context} recommendations={context.recommendations} />
    </ApplicationPageTemplate>
  );
}
