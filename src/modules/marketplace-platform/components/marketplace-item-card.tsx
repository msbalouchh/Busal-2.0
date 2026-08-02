import Link from "next/link";

import { marketplaceProductRoute } from "@/modules/marketplace-platform/constants/marketplace-platform";
import type { MarketplaceItemView } from "@/modules/marketplace/utils/marketplace-utils";

interface MarketplaceItemCardProps {
  item: MarketplaceItemView;
}

export function MarketplaceItemCard({ item }: MarketplaceItemCardProps) {
  return (
    <Link
      href={marketplaceProductRoute(item.slug)}
      className="bg-card hover:bg-muted/40 flex h-full flex-col rounded-xl border p-4 shadow-sm transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{item.name}</p>
        <span className="text-muted-foreground text-xs">{item.category.replaceAll("_", " ")}</span>
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm">{item.description}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>
          {item.pricingType === "FREE" ? "Free" : `£${(item.priceCents / 100).toFixed(2)}`}
        </span>
        <span>
          {item.averageRating.toFixed(1)} ★ ({item.reviewCount})
        </span>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        {item.publisherName} · v{item.versionLabel ?? "—"}
      </p>
    </Link>
  );
}

interface MarketplaceItemGridProps {
  items: MarketplaceItemView[];
  emptyMessage?: string;
}

export function MarketplaceItemGrid({
  items,
  emptyMessage = "No marketplace items found.",
}: MarketplaceItemGridProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MarketplaceItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
