import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportSearchPanel } from "@/modules/ai-support-agent-management/components/support-search-panel";
import { getSupportSearchContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Support" };
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiSupportSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSupportSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search support insights and recommendations."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Search" },
      ]}
    >
      <SupportSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
