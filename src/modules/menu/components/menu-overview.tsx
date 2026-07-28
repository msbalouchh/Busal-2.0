import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CategoryData,
  MenuItemData,
  ModifierGroupData,
} from "@/services/menu-management.service";

interface MenuOverviewProps {
  categories: CategoryData[];
  menuItems: MenuItemData[];
  modifierGroups: ModifierGroupData[];
}

export function MenuOverview({ categories, menuItems, modifierGroups }: MenuOverviewProps) {
  const activeCategories = categories.filter((category) => category.isActive);
  const availableItems = menuItems.filter((item) => item.isAvailable);
  const featuredItems = menuItems.filter((item) => item.isFeatured);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Total:</span> {categories.length}
          </p>
          <p>
            <span className="text-muted-foreground">Active:</span> {activeCategories.length}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Menu Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Total:</span> {menuItems.length}
          </p>
          <p>
            <span className="text-muted-foreground">Available:</span> {availableItems.length}
          </p>
          <p>
            <span className="text-muted-foreground">Featured:</span> {featuredItems.length}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Modifier Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Total groups:</span> {modifierGroups.length}
          </p>
          {modifierGroups.length === 0 ? (
            <p className="text-muted-foreground">No modifier groups yet.</p>
          ) : (
            modifierGroups.slice(0, 5).map((group) => (
              <p key={group.id}>
                <span className="font-medium">{group.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {group.options.length} options · {group.assignedItemCount} items
                </span>
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
