import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseSearchPanel } from "@/modules/enterprise-platform-management/components/enterprise-search-panel";
import { getEnterpriseSearchContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search" };
}

export default async function EnterpriseSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const context = await getEnterpriseSearchContext(params.q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search enterprise organizations and configuration."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Search" },
      ]}
    >
      <EnterpriseSearchPanel search={context.search} organizations={context.organizations} />
    </ApplicationPageTemplate>
  );
}
