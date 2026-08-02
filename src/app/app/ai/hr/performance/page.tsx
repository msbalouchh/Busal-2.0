import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrPerformancePanel } from "@/modules/ai-hr-agent-management/components/hr-performance-panel";
import { getHrPerformanceContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Performance Analytics" };
}

export default async function AiHrPerformancePage() {
  const context = await getHrPerformanceContext();

  return (
    <ApplicationPageTemplate
      title="Performance Analytics"
      description="Identify high performers and coaching opportunities."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Performance" },
      ]}
    >
      <HrPerformancePanel performance={context.performance} />
    </ApplicationPageTemplate>
  );
}
