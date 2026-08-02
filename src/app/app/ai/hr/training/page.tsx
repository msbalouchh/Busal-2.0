import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrTrainingPanel } from "@/modules/ai-hr-agent-management/components/hr-training-panel";
import { getHrTrainingContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Training Center" };
}

export default async function AiHrTrainingPage() {
  const context = await getHrTrainingContext();

  return (
    <ApplicationPageTemplate
      title="Training Center"
      description="AI-suggested training programs for your workforce."
      icon={GraduationCap}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Training" },
      ]}
    >
      <HrTrainingPanel training={context.training} />
    </ApplicationPageTemplate>
  );
}
