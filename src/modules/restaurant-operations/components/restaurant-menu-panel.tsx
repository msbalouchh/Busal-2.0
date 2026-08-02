"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoriesManager } from "@/modules/menu/components/categories-manager";
import { MenuItemsManager } from "@/modules/menu/components/menu-items-manager";
import { MenuOverview } from "@/modules/menu/components/menu-overview";
import { ModifiersManager } from "@/modules/menu/components/modifiers-manager";
import { FILE_PLATFORM_ROUTES } from "@/modules/file-platform/constants/routes";
import { bulkUpdateMenuAvailabilityAction } from "@/modules/restaurant-operations/actions/restaurant-operations-actions";
import type { RestaurantOperationsPermissions } from "@/modules/restaurant-operations/types/restaurant-operations-types";
import type {
  CategoryData,
  MenuItemData,
  ModifierGroupData,
} from "@/services/menu-management.service";

interface RestaurantMenuPanelProps {
  categories: CategoryData[];
  menuItems: MenuItemData[];
  modifierGroups: ModifierGroupData[];
  permissions: RestaurantOperationsPermissions;
}

export function RestaurantMenuPanel({
  categories,
  menuItems,
  modifierGroups,
  permissions,
}: RestaurantMenuPanelProps) {
  const [tab, setTab] = useState<"overview" | "categories" | "items" | "modifiers">("overview");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"" | "available" | "unavailable">(
    "",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = !categoryFilter || item.categoryId === categoryFilter;
      const matchesAvailability =
        !availabilityFilter ||
        (availabilityFilter === "available" ? item.isAvailable : !item.isAvailable);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, search, categoryFilter, availabilityFilter]);

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  const bulkSetAvailability = (isAvailable: boolean) => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one menu item");
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateMenuAvailabilityAction({
          menuItemIds: selectedIds,
          isAvailable,
        });
        toast.success(isAvailable ? "Items marked available" : "Items marked unavailable");
        setSelectedIds([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk update failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["overview", "categories", "items", "modifiers"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={tab === value ? "default" : "outline"}
            onClick={() => setTab(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "overview" ? (
        <MenuOverview
          categories={categories}
          menuItems={menuItems}
          modifierGroups={modifierGroups}
        />
      ) : null}

      {tab === "categories" ? <CategoriesManager categories={categories} /> : null}

      {tab === "modifiers" ? (
        <ModifiersManager modifierGroups={modifierGroups} menuItems={menuItems} />
      ) : null}

      {tab === "items" ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="menu-search">Search</Label>
              <Input
                id="menu-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search menu items"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-category">Category</Label>
              <select
                id="menu-category"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-availability">Availability</Label>
              <select
                id="menu-availability"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(event.target.value as "" | "available" | "unavailable")
                }
              >
                <option value="">All items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div className="flex items-end">
              <Link
                href={FILE_PLATFORM_ROUTES.overview}
                className="text-primary text-sm hover:underline"
              >
                Upload images via File Platform
              </Link>
            </div>
          </div>

          {permissions.canManageMenu ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={isPending} onClick={() => bulkSetAvailability(true)}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark available"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => bulkSetAvailability(false)}
              >
                Mark unavailable
              </Button>
              <span className="text-muted-foreground self-center text-sm">
                {selectedIds.length} selected
              </span>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {permissions.canManageMenu ? (
                    <th className="px-4 py-3 text-left">Select</th>
                  ) : null}
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    {permissions.canManageMenu ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.name}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.category?.name ?? "Uncategorised"}</td>
                    <td className="px-4 py-3">£{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">{item.isAvailable ? "Available" : "Unavailable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <MenuItemsManager
            menuItems={menuItems}
            categories={categories}
            modifierGroups={modifierGroups}
          />
        </div>
      ) : null}
    </div>
  );
}
