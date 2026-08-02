import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsSettingsPanel } from "@/modules/ai-skills-management/components/skills-settings-panel";
import { getSkillsSettingsContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skill Settings" };
}

export default async function AiSkillsSettingsPage() {
  const context = await getSkillsSettingsContext();

  return (
    <ApplicationPageTemplate
      title="Skill Settings"
      description="Configure skill metadata and framework settings."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills", href: "/app/ai/skills" },
        { label: "Settings" },
      ]}
    >
      <SkillsSettingsPanel context={context} skills={context.skills} />
    </ApplicationPageTemplate>
  );
}
