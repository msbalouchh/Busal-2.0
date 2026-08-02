import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperSearchPanel } from "@/modules/developer-platform-management/components/developer-search-panel";
import { getDeveloperSearchContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Developer Resources" };
}

export default async function DeveloperSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getDeveloperSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search applications, webhooks, and logs."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Search" },
      ]}
    >
      <DeveloperSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
