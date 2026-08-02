import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrAgentDashboardPanel } from "@/modules/ai-hr-agent-management/components/hr-agent-dashboard-panel";
import { getHrAgentDashboardContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI HR Agent" };
}

export default async function AiHrAgentDashboardPage() {
  const context = await getHrAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI HR Agent"
      description="Workforce insights, performance analytics, and HR recommendations."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent" },
      ]}
    >
      <HrAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        recommendations={context.recommendations}
        performance={context.performance}
        attendance={context.attendance}
        atRisk={context.atRisk}
      />
    </ApplicationPageTemplate>
  );
}
