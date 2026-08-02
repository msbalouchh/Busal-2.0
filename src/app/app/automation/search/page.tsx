import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AutomationSearchPanel } from "@/modules/automation-platform-management/components/automation-search-panel";
import { getAutomationSearchContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Automation" };
}

export default async function AutomationSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getAutomationSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search workflows and executions."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Automation", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
        { label: "Search" },
      ]}
    >
      <AutomationSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
