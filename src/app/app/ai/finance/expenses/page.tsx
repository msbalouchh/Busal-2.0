import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceExpensesPanel } from "@/modules/ai-finance-agent-management/components/finance-expenses-panel";
import { getFinanceExpensesContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Expense Analytics" };
}

export default async function AiFinanceExpensesPage() {
  const context = await getFinanceExpensesContext();

  return (
    <ApplicationPageTemplate
      title="Expense Analytics"
      description="Expense breakdown, unusual spending, and cost optimization."
      icon={Receipt}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Expenses" },
      ]}
    >
      <FinanceExpensesPanel
        expenses={context.expenses}
        costOptimizations={context.costOptimizations}
      />
    </ApplicationPageTemplate>
  );
}
