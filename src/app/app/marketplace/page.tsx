import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceHomePanel } from "@/modules/app-marketplace-management/components/app-marketplace-home-panel";
import { getAppMarketplaceHomeContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Marketplace" };
}

export default async function AppMarketplaceHomePage() {
  const context = await getAppMarketplaceHomeContext();

  return (
    <ApplicationPageTemplate
      title="Marketplace"
      description="Discover and install apps for your business."
      icon={ShoppingBag}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace" },
      ]}
    >
      <AppMarketplaceHomePanel
        context={context}
        summary={context.summary}
        featuredApps={context.featuredApps}
      />
    </ApplicationPageTemplate>
  );
}
