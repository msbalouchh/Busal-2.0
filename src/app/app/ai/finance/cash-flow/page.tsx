import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceCashFlowPanel } from "@/modules/ai-finance-agent-management/components/finance-cash-flow-panel";
import { getFinanceCashFlowContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Cash Flow View" };
}

export default async function AiFinanceCashFlowPage() {
  const context = await getFinanceCashFlowContext();

  return (
    <ApplicationPageTemplate
      title="Cash Flow View"
      description="Cash flow summary and revenue forecast framework."
      icon={ArrowLeftRight}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Cash Flow" },
      ]}
    >
      <FinanceCashFlowPanel cashFlow={context.cashFlow} forecast={context.forecast} />
    </ApplicationPageTemplate>
  );
}
