import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { HrSearchPanel } from "@/modules/ai-hr-agent-management/components/hr-search-panel";
import { getHrSearchContext } from "@/modules/ai-hr-agent-management/lib/get-ai-hr-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search HR" };
}

interface AiHrSearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiHrSearchPage({ searchParams }: AiHrSearchPageProps) {
  const params = await searchParams;
  const context = await getHrSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search HR insights and recommendations."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "HR Agent", href: "/app/ai/hr" },
        { label: "Search" },
      ]}
    >
      <HrSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
