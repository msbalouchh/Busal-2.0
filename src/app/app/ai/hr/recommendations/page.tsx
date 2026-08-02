import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrRecommendationsPanel } from "@/modules/ai-hr-agent-management/components/hr-recommendations-panel";
import { getHrRecommendationsContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "HR Recommendations" };
}

export default async function AiHrRecommendationsPage() {
  const context = await getHrRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Recommendations"
      description="Actionable HR recommendations and retention alerts."
      icon={Lightbulb}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Recommendations" },
      ]}
    >
      <HrRecommendationsPanel
        context={context}
        recommendations={context.recommendations}
        atRisk={context.atRisk}
      />
    </ApplicationPageTemplate>
  );
}
