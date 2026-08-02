import type { Metadata } from "next";
import { Download } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceInstalledPanel } from "@/modules/app-marketplace-management/components/app-marketplace-installed-panel";
import { getAppMarketplaceInstalledContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Installed Apps" };
}

export default async function AppMarketplaceInstalledPage() {
  const context = await getAppMarketplaceInstalledContext();

  return (
    <ApplicationPageTemplate
      title="Installed Apps"
      description="Manage installed marketplace apps."
      icon={Download}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Installed" },
      ]}
    >
      <AppMarketplaceInstalledPanel context={context} installed={context.installed} />
    </ApplicationPageTemplate>
  );
}
