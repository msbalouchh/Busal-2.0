import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrInsightsPanel } from "@/modules/ai-hr-agent-management/components/hr-insights-panel";
import { getHrInsightsContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "HR Insights" };
}

export default async function AiHrInsightsPage() {
  const context = await getHrInsightsContext();

  return (
    <ApplicationPageTemplate
      title="Employee Insights"
      description="AI-generated workforce insights and recommendations."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Insights" },
      ]}
    >
      <HrInsightsPanel context={context} insights={context.insights} />
    </ApplicationPageTemplate>
  );
}
