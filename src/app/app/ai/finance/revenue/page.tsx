import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceRevenuePanel } from "@/modules/ai-finance-agent-management/components/finance-revenue-panel";
import { getFinanceRevenueContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Revenue Analytics" };
}

export default async function AiFinanceRevenuePage() {
  const context = await getFinanceRevenueContext();

  return (
    <ApplicationPageTemplate
      title="Revenue Analytics"
      description="Monthly revenue trends and collection analysis."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Revenue" },
      ]}
    >
      <FinanceRevenuePanel revenue={context.revenue} />
    </ApplicationPageTemplate>
  );
}
