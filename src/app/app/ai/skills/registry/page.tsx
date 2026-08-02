import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import type { SkillCategory, SkillStatus } from "@prisma/client";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SkillsRegistryPanel } from "@/modules/ai-skills-management/components/skills-registry-panel";
import { getSkillsRegistryContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string; status?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Skills Registry" };
}

export default async function AiSkillsRegistryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSkillsRegistryContext({
    search: params.search,
    category: (params.category as SkillCategory | "ALL") ?? "ALL",
    status: (params.status as SkillStatus | "ALL") ?? "ALL",
    pageSize: 24,
  });

  return (
    <ApplicationPageTemplate
      title="Skills Registry"
      description="Register, discover, and manage AI skills."
      icon={Sparkles}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Skills", href: "/app/ai/skills" },
        { label: "Registry" },
      ]}
    >
      <SkillsRegistryPanel context={context} list={context.list} discovery={context.discovery} />
    </ApplicationPageTemplate>
  );
}
