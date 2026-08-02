import type { Metadata } from "next";
import { PoundSterling } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceAgentDashboardPanel } from "@/modules/ai-finance-agent-management/components/finance-agent-dashboard-panel";
import { getFinanceAgentDashboardContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Finance Agent" };
}

export default async function AiFinanceAgentDashboardPage() {
  const context = await getFinanceAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Finance Agent"
      description="Revenue, expenses, cash flow, and financial health insights."
      icon={PoundSterling}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent" },
      ]}
    >
      <FinanceAgentDashboardPanel
        context={context}
        stats={context.stats}
        insights={context.insights}
        recommendations={context.recommendations}
        revenue={context.revenue}
        cashFlow={context.cashFlow}
        risks={context.risks}
      />
    </ApplicationPageTemplate>
  );
}
