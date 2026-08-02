import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SalesSearchPanel } from "@/modules/ai-sales-agent-management/components/sales-search-panel";
import { getSalesSearchContext } from "@/modules/ai-sales-agent-management/lib/get-ai-sales-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Sales" };
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiSalesSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSalesSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search sales insights and recommendations."
      icon={TrendingUp}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Sales Agent", href: "/app/ai/sales" },
        { label: "Search" },
      ]}
    >
      <SalesSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
