import type { MarketplaceDashboardView } from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceDashboardProps {
  dashboard: MarketplaceDashboardView;
}

export function MarketplaceDashboard({ dashboard }: MarketplaceDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Catalogue Items</p>
        <p className="text-2xl font-semibold">{dashboard.totalItems}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Installed</p>
        <p className="text-2xl font-semibold">{dashboard.installedCount}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Free Items</p>
        <p className="text-2xl font-semibold">{dashboard.freeItems}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Paid Items</p>
        <p className="text-2xl font-semibold">{dashboard.paidItems}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Reviews</p>
        <p className="text-2xl font-semibold">{dashboard.totalReviews}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Average Rating</p>
        <p className="text-2xl font-semibold">{dashboard.averageRating.toFixed(1)}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Revenue</p>
        <p className="text-2xl font-semibold">${(dashboard.totalRevenueCents / 100).toFixed(2)}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Publishers</p>
        <p className="text-2xl font-semibold">{dashboard.publisherCount}</p>
      </div>
    </div>
  );
}
