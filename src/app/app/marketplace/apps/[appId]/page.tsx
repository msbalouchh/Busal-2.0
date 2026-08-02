import type { Metadata } from "next";
import { AppWindow } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceDetailPanel } from "@/modules/app-marketplace-management/components/app-marketplace-detail-panel";
import { getAppMarketplaceDetailContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "App Details" };
}

export default async function AppMarketplaceDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const context = await getAppMarketplaceDetailContext(appId);

  return (
    <ApplicationPageTemplate
      title={context.app.name}
      description="App details, reviews, and installation."
      icon={AppWindow}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Store", href: APP_MARKETPLACE_ROUTES.store() },
        { label: context.app.name },
      ]}
    >
      <AppMarketplaceDetailPanel context={context} app={context.app} reviews={context.reviews} />
    </ApplicationPageTemplate>
  );
}
