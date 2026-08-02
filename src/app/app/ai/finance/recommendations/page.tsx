import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceRecommendationsPanel } from "@/modules/ai-finance-agent-management/components/finance-recommendations-panel";
import { getFinanceRecommendationsContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Financial Recommendations" };
}

export default async function AiFinanceRecommendationsPage() {
  const context = await getFinanceRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Recommendations"
      description="Actionable financial recommendations and risk alerts."
      icon={Lightbulb}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Recommendations" },
      ]}
    >
      <FinanceRecommendationsPanel
        context={context}
        recommendations={context.recommendations}
        risks={context.risks}
      />
    </ApplicationPageTemplate>
  );
}
