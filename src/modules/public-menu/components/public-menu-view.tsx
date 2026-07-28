import { PublicMenuCategorySection } from "@/modules/public-menu/components/public-menu-category-section";
import { PublicMenuHeader } from "@/modules/public-menu/components/public-menu-header";
import { PublicMenuItemCard } from "@/modules/public-menu/components/public-menu-item-card";
import type { PublicMenuViewModel } from "@/modules/public-menu/lib/public-menu-utils";

interface PublicMenuViewProps {
  menu: PublicMenuViewModel;
  onAddItem?: (menuItemId: string) => void;
  isCartPending?: boolean;
}

export function PublicMenuView({ menu, onAddItem, isCartPending }: PublicMenuViewProps) {
  const hasCategories = menu.categories.length > 0;
  const hasItems =
    menu.categories.some((category) => category.items.length > 0) ||
    menu.uncategorizedItems.length > 0;

  return (
    <div className="bg-muted/30 min-h-screen">
      <PublicMenuHeader business={menu.business} />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-28">
        {!hasCategories && !hasItems ? (
          <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium">Menu coming soon</p>
            <p className="text-muted-foreground mt-2 text-sm">
              This business has not published any menu items yet.
            </p>
          </div>
        ) : null}

        {hasCategories ? (
          <div className="space-y-8">
            {menu.categories.map((category) => (
              <PublicMenuCategorySection
                key={category.id}
                category={category}
                onAddItem={onAddItem}
                isCartPending={isCartPending}
              />
            ))}
          </div>
        ) : hasItems ? (
          <div className="rounded-xl border border-dashed bg-white px-6 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Menu items are available, but no active categories have been set up yet.
            </p>
          </div>
        ) : null}

        {menu.uncategorizedItems.length > 0 ? (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Other items</h2>
            <div className="space-y-3">
              {menu.uncategorizedItems.map((item) => (
                <PublicMenuItemCard
                  key={item.id}
                  item={item}
                  onAddItem={onAddItem}
                  isCartPending={isCartPending}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
