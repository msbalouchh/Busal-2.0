import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceCategoriesPanel } from "@/modules/app-marketplace-management/components/app-marketplace-categories-panel";
import { getAppMarketplaceCategoriesContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Categories" };
}

export default async function AppMarketplaceCategoriesPage() {
  const context = await getAppMarketplaceCategoriesContext();

  return (
    <ApplicationPageTemplate
      title="Categories"
      description="Browse apps by category."
      icon={LayoutGrid}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Categories" },
      ]}
    >
      <AppMarketplaceCategoriesPanel categories={context.categories} />
    </ApplicationPageTemplate>
  );
}
