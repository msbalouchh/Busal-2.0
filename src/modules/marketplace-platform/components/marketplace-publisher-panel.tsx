import { MarketplaceItemGrid } from "@/modules/marketplace-platform/components/marketplace-item-card";
import type {
  MarketplacePlatformPermissions,
  PublisherPortalView,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";

interface MarketplacePublisherPanelProps {
  permissions: MarketplacePlatformPermissions;
  portal: PublisherPortalView;
}

export function MarketplacePublisherPanel({ permissions, portal }: MarketplacePublisherPanelProps) {
  if (!permissions.canViewPublisherPortal) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to access the publisher portal.
      </p>
    );
  }

  if (!portal.publisher) {
    return (
      <p className="text-muted-foreground rounded-lg border p-4 text-sm">
        No publisher profile is linked to this business yet. Publishing requires marketplace publish
        permissions and a verified publisher account.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{portal.publisher.name}</h2>
        <p className="text-muted-foreground text-sm">
          {portal.publisher.verified ? "Verified publisher" : "Publisher"} · {portal.publisher.slug}
        </p>
      </div>

      {portal.dashboard ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Published items</p>
            <p className="text-2xl font-semibold">{portal.dashboard.publishedItems}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Downloads</p>
            <p className="text-2xl font-semibold">{portal.dashboard.totalDownloads}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Revenue</p>
            <p className="text-2xl font-semibold">
              £{(portal.dashboard.totalRevenueCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Average rating</p>
            <p className="text-2xl font-semibold">{portal.dashboard.averageRating.toFixed(1)}</p>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">My apps & extensions</h2>
        <MarketplaceItemGrid
          items={portal.items}
          emptyMessage="No published marketplace items for this publisher yet."
        />
      </section>
    </div>
  );
}
