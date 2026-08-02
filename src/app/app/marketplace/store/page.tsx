import type { Metadata } from "next";
import { Store } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceStorePanel } from "@/modules/app-marketplace-management/components/app-marketplace-store-panel";
import { getAppMarketplaceStoreContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "App Store" };
}

export default async function AppMarketplaceStorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const context = await getAppMarketplaceStoreContext(category);

  return (
    <ApplicationPageTemplate
      title="App Store"
      description="Browse and install marketplace apps."
      icon={Store}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Store" },
      ]}
    >
      <AppMarketplaceStorePanel context={context} apps={context.apps} />
    </ApplicationPageTemplate>
  );
}
