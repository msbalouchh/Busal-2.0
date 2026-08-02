import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AssistantDashboardPanel } from "@/modules/ai-restaurant-assistant-management/components/assistant-dashboard-panel";
import { getAssistantDashboardContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Assistant" };
}

export default async function AssistantDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getAssistantDashboardContext(params.branchId);

  return (
    <ApplicationPageTemplate
      title="AI Restaurant Assistant"
      description="Intelligent assistant for sales, operations, inventory, and customer insights."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "AI Assistant" },
      ]}
    >
      <AssistantDashboardPanel
        context={context}
        health={context.health}
        summaries={context.summaries}
        recommendations={context.recommendations}
        recentConversations={context.recentConversations}
      />
    </ApplicationPageTemplate>
  );
}
