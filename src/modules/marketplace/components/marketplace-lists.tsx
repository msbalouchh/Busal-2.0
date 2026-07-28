import type {
  MarketplaceHistoryView,
  MarketplaceInstallationView,
  MarketplaceItemView,
  MarketplaceReviewView,
} from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceListsProps {
  items?: MarketplaceItemView[];
  installations?: MarketplaceInstallationView[];
  history?: MarketplaceHistoryView[];
  reviews?: MarketplaceReviewView[];
  publishers?: Array<{
    publisher: {
      id: string;
      slug: string;
      name: string;
      verified: boolean;
      totalDownloads: number;
      totalRevenueCents: number;
    };
    dashboard: {
      totalDownloads: number;
      totalRevenueCents: number;
      publishedItems: number;
      averageRating: number;
    };
  }>;
  revenue?: Array<{
    id: string;
    itemName: string;
    publisherName: string;
    amountCents: number;
    commissionCents: number;
    revenueShareCents: number;
    billingType: string;
    createdAt: string;
  }>;
}

export function MarketplaceLists({
  items = [],
  installations = [],
  history = [],
  reviews = [],
  publishers = [],
  revenue = [],
}: MarketplaceListsProps) {
  return (
    <div className="space-y-8">
      {items.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Catalogue</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <span className="text-muted-foreground text-xs">{item.category}</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>
                    {item.pricingType === "FREE"
                      ? "Free"
                      : `$${(item.priceCents / 100).toFixed(2)}`}
                  </span>
                  <span>
                    {item.averageRating.toFixed(1)} ★ ({item.reviewCount})
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {item.publisherName} · v{item.versionLabel ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {installations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Installed Extensions</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Installed</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => (
                  <tr key={installation.id} className="border-t">
                    <td className="px-4 py-2">{installation.itemName}</td>
                    <td className="px-4 py-2">{installation.versionLabel ?? "—"}</td>
                    <td className="px-4 py-2">{installation.status}</td>
                    <td className="px-4 py-2">
                      {new Date(installation.installedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {publishers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Publishers</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {publishers.map(({ publisher, dashboard }) => (
              <div key={publisher.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{publisher.name}</p>
                <p className="text-muted-foreground text-sm">
                  {publisher.verified ? "Verified publisher" : "Publisher"}
                </p>
                <p className="mt-2 text-sm">Downloads: {dashboard.totalDownloads}</p>
                <p className="text-sm">
                  Revenue: ${(dashboard.totalRevenueCents / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Reviews</h2>
          <div className="space-y-2">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.itemName}</p>
                  <span>{review.rating} ★</span>
                </div>
                {review.title ? <p className="mt-1 text-sm">{review.title}</p> : null}
                {review.content ? (
                  <p className="text-muted-foreground mt-1 text-sm">{review.content}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {revenue.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Revenue Records</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Publisher</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Billing</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="px-4 py-2">{record.itemName}</td>
                    <td className="px-4 py-2">{record.publisherName}</td>
                    <td className="px-4 py-2">${(record.amountCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-2">{record.billingType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Installation History</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-2">{entry.itemName}</td>
                    <td className="px-4 py-2">{entry.action}</td>
                    <td className="px-4 py-2">{entry.status}</td>
                    <td className="px-4 py-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
