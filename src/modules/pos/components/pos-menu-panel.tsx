"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PosMenuCategoryView, PosMenuItemView } from "@/modules/pos/types/pos";
import { filterPosMenuItems, formatPosMoney } from "@/modules/pos/utils/pos-utils";

interface PosMenuPanelProps {
  categories: PosMenuCategoryView[];
  menuItems: PosMenuItemView[];
  selectedCategoryId: string | null;
  searchQuery: string;
  isPending: boolean;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (value: string) => void;
  onAddItem: (menuItemId: string) => void;
}

export function PosMenuPanel({
  categories,
  menuItems,
  selectedCategoryId,
  searchQuery,
  isPending,
  onCategoryChange,
  onSearchChange,
  onAddItem,
}: PosMenuPanelProps) {
  const filteredItems = filterPosMenuItems(menuItems, {
    categoryId: selectedCategoryId,
    searchQuery,
  });

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <div className="space-y-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search menu items..."
            className="h-11 pl-9"
            aria-label="Search menu items"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedCategoryId === null ? "default" : "outline"}
            disabled={isPending}
            onClick={() => onCategoryChange(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              disabled={isPending}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed p-6 text-sm">
            No menu items match your search.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isPending}
                onClick={() => onAddItem(item.id)}
                className={cn(
                  "bg-background hover:border-primary min-h-28 touch-manipulation rounded-xl border p-4 text-left transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.description ? (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatPosMoney(item.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
