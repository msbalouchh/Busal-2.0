import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsExecutionsPanel } from "@/modules/ai-skills-management/components/skills-executions-panel";
import { getSkillsExecutionsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skill Executions" };
}

export default async function AiSkillsExecutionsPage() {
  const context = await getSkillsExecutionsContext();

  return (
    <ApplicationPageTemplate
      title="Skill Execution History"
      description="Review skill execution history across your business."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills", href: "/app/ai/skills" },
        { label: "Executions" },
      ]}
    >
      <SkillsExecutionsPanel context={context} executions={context.executions} />
    </ApplicationPageTemplate>
  );
}
