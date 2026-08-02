import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsCategoriesPanel } from "@/modules/ai-skills-management/components/skills-categories-panel";
import { getSkillsCategoriesContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skill Categories" };
}

export default async function AiSkillsCategoriesPage() {
  const context = await getSkillsCategoriesContext();

  return (
    <ApplicationPageTemplate
      title="Skill Categories"
      description="Browse skill categories and capability groupings."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills", href: "/app/ai/skills" },
        { label: "Categories" },
      ]}
    >
      <SkillsCategoriesPanel context={context} categories={context.categories} />
    </ApplicationPageTemplate>
  );
}
