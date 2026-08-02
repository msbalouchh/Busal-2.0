import type { Metadata } from "next";
import { Star } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AppMarketplaceReviewsPanel } from "@/modules/app-marketplace-management/components/app-marketplace-reviews-panel";
import { getAppMarketplaceReviewsContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "App Reviews" };
}

export default async function AppMarketplaceReviewsPage() {
  const context = await getAppMarketplaceReviewsContext();

  return (
    <ApplicationPageTemplate
      title="Reviews"
      description="Your app reviews and ratings."
      icon={Star}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Marketplace", href: APP_MARKETPLACE_ROUTES.home() },
        { label: "Reviews" },
      ]}
    >
      <AppMarketplaceReviewsPanel reviews={context.reviews} />
    </ApplicationPageTemplate>
  );
}
