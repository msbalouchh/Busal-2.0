import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { OperationsSearchPanel } from "@/modules/ai-operations-agent-management/components/operations-search-panel";
import { getOperationsSearchContext } from "@/modules/ai-operations-agent-management/lib/get-ai-operations-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search | AI Operations Agent" };
}

interface AiOperationsSearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiOperationsSearchPage({
  searchParams,
}: AiOperationsSearchPageProps) {
  const params = await searchParams;
  const context = await getOperationsSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search operational insights and recommendations."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Operations Agent", href: "/app/ai/operations" },
        { label: "Search" },
      ]}
    >
      <OperationsSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
