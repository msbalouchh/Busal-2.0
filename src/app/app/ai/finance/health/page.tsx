import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceHealthPanel } from "@/modules/ai-finance-agent-management/components/finance-health-panel";
import { getFinanceHealthContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Financial Health" };
}

export default async function AiFinanceHealthPage() {
  const context = await getFinanceHealthContext();

  return (
    <ApplicationPageTemplate
      title="Financial Health"
      description="Business health score and financial risk alerts."
      icon={Heart}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Health" },
      ]}
    >
      <FinanceHealthPanel health={context.health} risks={context.risks} />
    </ApplicationPageTemplate>
  );
}
