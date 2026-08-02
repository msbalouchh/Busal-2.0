import type { Metadata } from "next";
import { Settings2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceSettingsPanel } from "@/modules/app-marketplace-management/components/app-marketplace-settings-panel";
import { getAppMarketplaceSettingsContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "App Settings" };
}

export default async function AppMarketplaceSettingsPage({
  params,
}: {
  params: Promise<{ installedAppId: string }>;
}) {
  const { installedAppId } = await params;
  const context = await getAppMarketplaceSettingsContext(installedAppId);

  return (
    <ApplicationPageTemplate
      title="App Settings"
      description={`Configure ${context.installed.appName}.`}
      icon={Settings2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Installed", href: APP_MARKETPLACE_ROUTES.installed() },
        { label: context.installed.appName },
      ]}
    >
      <AppMarketplaceSettingsPanel
        context={context}
        installed={context.installed}
        configuration={context.configuration}
      />
    </ApplicationPageTemplate>
  );
}
