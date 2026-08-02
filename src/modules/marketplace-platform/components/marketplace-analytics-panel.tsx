import type {
  MarketplaceAnalyticsSnapshot,
  MarketplaceHomeWidgets,
  MarketplacePlatformPermissions,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";
import type { MarketplaceReviewView } from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceAnalyticsPanelProps {
  permissions: MarketplacePlatformPermissions;
  analytics: MarketplaceAnalyticsSnapshot | null;
  widgets: MarketplaceHomeWidgets;
  reviews: MarketplaceReviewView[];
}

export function MarketplaceAnalyticsPanel({
  permissions,
  analytics,
  widgets,
  reviews,
}: MarketplaceAnalyticsPanelProps) {
  if (!permissions.canViewAnalytics || !analytics) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view marketplace analytics.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Downloads</p>
          <p className="text-2xl font-semibold">{analytics.totalDownloads.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Active installations</p>
          <p className="text-2xl font-semibold">{analytics.activeInstallations}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Revenue</p>
          <p className="text-2xl font-semibold">
            £{(analytics.totalRevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Average rating</p>
          <p className="text-2xl font-semibold">{analytics.averageRating.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Reviews</p>
          <p className="text-2xl font-semibold">{analytics.totalReviews}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Free items</p>
          <p className="text-2xl font-semibold">{analytics.freeItems}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Paid items</p>
          <p className="text-2xl font-semibold">{analytics.paidItems}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Installed items</p>
          <p className="text-2xl font-semibold">{widgets.installedCount}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Category breakdown</h2>
          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No category data available.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.categoryBreakdown.map((entry) => (
                <li key={entry.category} className="flex items-center justify-between gap-3">
                  <span>{entry.category.replaceAll("_", " ")}</span>
                  <span className="text-muted-foreground">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Recent reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews submitted yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {reviews.slice(0, 8).map((review) => (
                <li key={review.id}>
                  <span className="font-medium">{review.itemName}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {review.rating} ★ · {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
