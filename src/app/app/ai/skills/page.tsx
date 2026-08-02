import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsDashboardPanel } from "@/modules/ai-skills-management/components/skills-dashboard-panel";
import { getSkillsDashboardContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Skills" };
}

export default async function AiSkillsDashboardPage() {
  const context = await getSkillsDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Skills Library"
      description="Shared capability layer for every AI agent in Busal OS."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills" },
      ]}
    >
      <SkillsDashboardPanel
        context={context}
        stats={context.stats}
        recent={context.recent}
        discovery={context.discovery}
      />
    </ApplicationPageTemplate>
  );
}
