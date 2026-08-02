import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceSearchPanel } from "@/modules/app-marketplace-management/components/app-marketplace-search-panel";
import { getAppMarketplaceSearchContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Apps" };
}

export default async function AppMarketplaceSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getAppMarketplaceSearchContext(q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search marketplace apps."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Search" },
      ]}
    >
      <AppMarketplaceSearchPanel search={context.search} apps={context.apps} />
    </ApplicationPageTemplate>
  );
}
