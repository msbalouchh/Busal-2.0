import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AssistantNav } from "@/modules/ai-restaurant-assistant-management/components/assistant-nav";
import {
  BusinessHealthCard,
  InsightCardsGrid,
  PeriodSummaryCards,
} from "@/modules/ai-restaurant-assistant-management/components/insight-cards";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { getAssistantInsightsContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Insights" };
}

export default async function AssistantInsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getAssistantInsightsContext(params.branchId);

  return (
    <ApplicationPageTemplate
      title="Business Insights"
      description="Daily, weekly, and monthly summaries powered by your restaurant data."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "AI Assistant", href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard() },
        { label: "Insights" },
      ]}
    >
      <div className="space-y-8">
        <AssistantNav />
        <BusinessHealthCard health={context.health} />
        <InsightCardsGrid insights={context.health.highlights} title="Health highlights" />
        <PeriodSummaryCards summaries={context.summaries} />
      </div>
    </ApplicationPageTemplate>
  );
}
