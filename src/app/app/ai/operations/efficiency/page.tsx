import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsEfficiencyPanel } from "@/modules/ai-operations-agent-management/components/operations-efficiency-panel";
import { getOperationsEfficiencyContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Efficiency Insights | AI Operations Agent" };
}

export default async function AiOperationsEfficiencyPage() {
  const context = await getOperationsEfficiencyContext();

  return (
    <ApplicationPageTemplate
      title="Efficiency Insights"
      description="Operational trends, kitchen efficiency, and bottleneck analysis."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Efficiency" },
      ]}
    >
      <OperationsEfficiencyPanel trends={context.trends} bottlenecks={context.bottlenecks} />
    </ApplicationPageTemplate>
  );
}
