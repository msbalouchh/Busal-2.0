import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AssistantNav } from "@/modules/ai-restaurant-assistant-management/components/assistant-nav";
import { RecommendationCards } from "@/modules/ai-restaurant-assistant-management/components/recommendation-cards";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { getAssistantRecommendationsContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Recommendations" };
}

export default async function AssistantRecommendationsPage() {
  const context = await getAssistantRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Recommendation Center"
      description="AI-generated operational recommendations for your restaurant."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "AI Assistant", href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard() },
        { label: "Recommendations" },
      ]}
    >
      <div className="space-y-6">
        <AssistantNav />
        <RecommendationCards
          recommendations={context.recommendations}
          canManage={context.permissionsFlags.canManageRecommendations}
        />
      </div>
    </ApplicationPageTemplate>
  );
}
