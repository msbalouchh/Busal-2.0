import { PublicMenuItemCard } from "@/modules/public-menu/components/public-menu-item-card";
import type { PublicMenuCategoryView } from "@/modules/public-menu/lib/public-menu-utils";

interface PublicMenuCategorySectionProps {
  category: PublicMenuCategoryView;
  onAddItem?: (menuItemId: string) => void;
  isCartPending?: boolean;
}

export function PublicMenuCategorySection({
  category,
  onAddItem,
  isCartPending,
}: PublicMenuCategorySectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
        {category.description ? (
          <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>
        ) : null}
      </div>
      {category.items.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
          No items in this category yet.
        </p>
      ) : (
        <div className="space-y-3">
          {category.items.map((item) => (
            <PublicMenuItemCard
              key={item.id}
              item={item}
              onAddItem={onAddItem}
              isCartPending={isCartPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}
