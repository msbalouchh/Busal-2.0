"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { QrMenuCategory } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCategoryNavProps {
  categories: QrMenuCategory[];
  activeCategoryId: string | null;
  search: string;
  onCategoryChange: (categoryId: string | null) => void;
  onSearchChange: (value: string) => void;
}

export function QrCategoryNav({
  categories,
  activeCategoryId,
  search,
  onCategoryChange,
  onSearchChange,
}: QrCategoryNavProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search menu"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeCategoryId === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategoryId === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
