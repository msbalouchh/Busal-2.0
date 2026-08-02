import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportRecommendationsPanel } from "@/modules/ai-support-agent-management/components/support-recommendations-panel";
import { getSupportRecommendationsContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Support Recommendations" };
}

export default async function AiSupportRecommendationsPage() {
  const context = await getSupportRecommendationsContext();

  return (
    <ApplicationPageTemplate
      title="Recommendations"
      description="Suggested responses, knowledge articles, and resolution actions."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Recommendations" },
      ]}
    >
      <SupportRecommendationsPanel context={context} recommendations={context.recommendations} />
    </ApplicationPageTemplate>
  );
}
