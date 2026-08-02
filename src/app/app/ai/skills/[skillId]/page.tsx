import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillDetailPanel } from "@/modules/ai-skills-management/components/skill-detail-panel";
import { getSkillDetailContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

interface PageProps {
  params: Promise<{ skillId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skill Detail" };
}

export default async function AiSkillDetailPage({ params }: PageProps) {
  const { skillId } = await params;

  try {
    const context = await getSkillDetailContext(skillId);

    return (
      <ApplicationPageTemplate
        title={context.skill.name}
        description="Skill details, schemas, and execution history."
        icon={Sparkles}
        breadcrumbs={[
          { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
          { label: "AI", href: "/app/ai" },
          { label: "Skills", href: "/app/ai/skills" },
          { label: context.skill.name },
        ]}
      >
        <SkillDetailPanel context={context} skill={context.skill} executions={context.executions} />
      </ApplicationPageTemplate>
    );
  } catch {
    notFound();
  }
}
