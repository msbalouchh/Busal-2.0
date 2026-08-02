import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { IntegrationSearchPanel } from "@/modules/integration-platform-management/components/integration-search-panel";
import { getIntegrationSearchContext } from "@/modules/integration-platform-management/lib/get-integration-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search | Integrations" };
}

interface IntegrationSearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function IntegrationSearchPage({ searchParams }: IntegrationSearchPageProps) {
  const params = await searchParams;
  const context = await getIntegrationSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search providers, connections, and logs."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Integrations", href: "/app/integrations" },
        { label: "Search" },
      ]}
    >
      <IntegrationSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
