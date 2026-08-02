import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceProfitabilityPanel } from "@/modules/ai-finance-agent-management/components/finance-profitability-panel";
import { getFinanceProfitabilityContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Profitability Overview" };
}

export default async function AiFinanceProfitabilityPage() {
  const context = await getFinanceProfitabilityContext();

  return (
    <ApplicationPageTemplate
      title="Profitability Overview"
      description="Profit margins and service-level profitability analysis."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Profitability" },
      ]}
    >
      <FinanceProfitabilityPanel profitability={context.profitability} />
    </ApplicationPageTemplate>
  );
}
