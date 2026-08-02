import Link from "next/link";

import { MARKETPLACE_PLATFORM_ROUTES } from "@/modules/marketplace-platform/constants/marketplace-platform";
import { MarketplaceItemGrid } from "@/modules/marketplace-platform/components/marketplace-item-card";
import type {
  MarketplaceHomeSection,
  MarketplaceHomeWidgets,
  MarketplacePlatformPermissions,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";
import type { MarketplaceItemView } from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplacePlatformOverviewProps {
  widgets: MarketplaceHomeWidgets;
  permissions: MarketplacePlatformPermissions;
  homeSections: MarketplaceHomeSection[];
  recentlyInstalled: MarketplaceItemView[];
  recommended: MarketplaceItemView[];
  registeredExtensionCount: number;
}

export function MarketplacePlatformOverview({
  widgets,
  permissions,
  homeSections,
  recentlyInstalled,
  recommended,
  registeredExtensionCount,
}: MarketplacePlatformOverviewProps) {
  const summaryCards = [
    { label: "Catalogue items", value: widgets.totalItems.toString() },
    { label: "Installed", value: widgets.installedCount.toString() },
    { label: "Active licenses", value: widgets.activeLicenses.toString() },
    { label: "Expiring licenses", value: widgets.expiringLicenses.toString() },
    { label: "Average rating", value: widgets.averageRating.toFixed(1) },
    { label: "Publishers", value: widgets.publisherCount.toString() },
  ];

  const quickActions = [
    {
      label: "Browse catalog",
      href: MARKETPLACE_PLATFORM_ROUTES.catalog,
      visible: permissions.canViewMarketplace,
    },
    {
      label: "Manage installations",
      href: MARKETPLACE_PLATFORM_ROUTES.installations,
      visible: permissions.canInstall,
    },
    {
      label: "AI Agent Store",
      href: MARKETPLACE_PLATFORM_ROUTES.agents,
      visible: permissions.canViewMarketplace,
    },
    {
      label: "View licenses",
      href: MARKETPLACE_PLATFORM_ROUTES.licenses,
      visible: permissions.canManageLicenses,
    },
  ].filter((action) => action.visible);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        {registeredExtensionCount} registered extensions available through the marketplace registry.
      </p>

      {quickActions.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {homeSections.map((section) => (
        <section key={section.key} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{section.label}</h2>
            <Link
              href={MARKETPLACE_PLATFORM_ROUTES.catalog}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </div>
          <MarketplaceItemGrid items={section.items} />
        </section>
      ))}

      {recentlyInstalled.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recently installed</h2>
          <MarketplaceItemGrid items={recentlyInstalled} />
        </section>
      ) : null}

      {recommended.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recommended for your business</h2>
          <MarketplaceItemGrid items={recommended} />
        </section>
      ) : null}
    </div>
  );
}
