import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsRisksPanel } from "@/modules/ai-operations-agent-management/components/operations-risks-panel";
import { getOperationsRisksContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Risk Center | AI Operations Agent" };
}

export default async function AiOperationsRisksPage() {
  const context = await getOperationsRisksContext();

  return (
    <ApplicationPageTemplate
      title="Risk Center"
      description="Operational risk detection and mitigation recommendations."
      icon={ShieldAlert}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Risks" },
      ]}
    >
      <OperationsRisksPanel risks={context.risks} />
    </ApplicationPageTemplate>
  );
}
