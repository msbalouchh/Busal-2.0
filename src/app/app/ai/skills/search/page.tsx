import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsSearchPanel } from "@/modules/ai-skills-management/components/skills-search-panel";
import { getSkillsSearchContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skill Search" };
}

export default async function AiSkillsSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSkillsSearchContext({ search: params.search, pageSize: 24 });

  return (
    <ApplicationPageTemplate
      title="Skill Search"
      description="Search the AI skills library."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills", href: "/app/ai/skills" },
        { label: "Search" },
      ]}
    >
      <SkillsSearchPanel context={context} results={context.results} query={context.query} />
    </ApplicationPageTemplate>
  );
}
