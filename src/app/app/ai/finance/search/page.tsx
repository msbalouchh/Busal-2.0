import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { FinanceSearchPanel } from "@/modules/ai-finance-agent-management/components/finance-search-panel";
import { getFinanceSearchContext } from "@/modules/ai-finance-agent-management/lib/get-ai-finance-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Finance" };
}

interface AiFinanceSearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiFinanceSearchPage({ searchParams }: AiFinanceSearchPageProps) {
  const params = await searchParams;
  const context = await getFinanceSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search financial insights and recommendations."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Finance Agent", href: "/app/ai/finance" },
        { label: "Search" },
      ]}
    >
      <FinanceSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
