import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsRecommendationsPanel } from "@/modules/ai-operations-agent-management/components/operations-recommendations-panel";
import { getOperationsRecommendationsContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Recommendations | AI Operations Agent" };
}

export default async function AiOperationsRecommendationsPage() {
  const context = await getOperationsRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Optimization Recommendations"
      description="Actionable recommendations to improve operational efficiency."
      icon={Lightbulb}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Recommendations" },
      ]}
    >
      <OperationsRecommendationsPanel
        context={context}
        recommendations={context.recommendations}
        bottlenecks={context.bottlenecks}
      />
    </ApplicationPageTemplate>
  );
}
