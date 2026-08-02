import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesOpportunitiesPanel } from "@/modules/ai-sales-agent-management/components/sales-opportunities-panel";
import { getSalesOpportunitiesContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Sales Opportunities" };
}

export default async function AiSalesOpportunitiesPage() {
  const context = await getSalesOpportunitiesContext();

  return (
    <ApplicationPageTemplate
      title="Sales Opportunities"
      description="Detected leads, pipeline deals, and follow-up suggestions."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent", href: "/app/ai/sales" },
        { label: "Opportunities" },
      ]}
    >
      <SalesOpportunitiesPanel
        opportunities={context.opportunities}
        pipeline={context.pipeline}
        followUps={context.followUps}
      />
    </ApplicationPageTemplate>
  );
}
