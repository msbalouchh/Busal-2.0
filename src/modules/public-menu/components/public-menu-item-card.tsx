import { Loader2, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { PublicMenuItemView } from "@/modules/public-menu/lib/public-menu-utils";

interface PublicMenuItemCardProps {
  item: PublicMenuItemView;
  onAddItem?: (menuItemId: string) => void;
  isCartPending?: boolean;
}

function ItemBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "featured" | "unavailable";
}) {
  const className =
    variant === "featured"
      ? "bg-secondary text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
      : "border-input text-muted-foreground shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium";

  return <span className={className}>{children}</span>;
}

export function PublicMenuItemCard({ item, onAddItem, isCartPending }: PublicMenuItemCardProps) {
  return (
    <article className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
      <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-24 sm:w-24">
        <span className="text-muted-foreground text-xs font-medium">No image</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="text-base leading-tight font-semibold">{item.name}</h3>
          {item.isFeatured ? <ItemBadge variant="featured">Featured</ItemBadge> : null}
          {!item.isAvailable ? <ItemBadge variant="unavailable">Unavailable</ItemBadge> : null}
        </div>
        {item.description ? (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{item.description}</p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{item.priceLabel}</p>
          {item.isAvailable && onAddItem ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onAddItem(item.id)}
              disabled={isCartPending}
            >
              {isCartPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
