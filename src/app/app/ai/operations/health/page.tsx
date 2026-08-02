import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsHealthPanel } from "@/modules/ai-operations-agent-management/components/operations-health-panel";
import { getOperationsHealthContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Operational Health | AI Operations Agent" };
}

export default async function AiOperationsHealthPage() {
  const context = await getOperationsHealthContext();

  return (
    <ApplicationPageTemplate
      title="Operational Health"
      description="Health score, bottlenecks, and operational risk alerts."
      icon={HeartPulse}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Health" },
      ]}
    >
      <OperationsHealthPanel
        health={context.health}
        bottlenecks={context.bottlenecks}
        risks={context.risks}
      />
    </ApplicationPageTemplate>
  );
}
