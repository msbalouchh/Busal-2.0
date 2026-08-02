import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceUpdatesPanel } from "@/modules/app-marketplace-management/components/app-marketplace-updates-panel";
import { getAppMarketplaceUpdatesContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "App Updates" };
}

export default async function AppMarketplaceUpdatesPage() {
  const context = await getAppMarketplaceUpdatesContext();

  return (
    <ApplicationPageTemplate
      title="Updates"
      description="Update or rollback installed apps."
      icon={RefreshCw}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Updates" },
      ]}
    >
      <AppMarketplaceUpdatesPanel context={context} updates={context.updates} />
    </ApplicationPageTemplate>
  );
}
