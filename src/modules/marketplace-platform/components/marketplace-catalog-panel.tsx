"use client";

import { useMemo, useState, useTransition } from "react";

import { MARKETPLACE_CATALOG_SORT_OPTIONS } from "@/modules/marketplace-platform/constants/marketplace-platform";
import type { MarketplaceCatalogResult } from "@/modules/marketplace-platform/types/marketplace-platform-types";
import { searchMarketplaceCatalogAction } from "@/modules/marketplace-platform/actions/marketplace-platform-actions";
import { MarketplaceItemGrid } from "@/modules/marketplace-platform/components/marketplace-item-card";

interface MarketplaceCatalogPanelProps {
  initialCatalog: MarketplaceCatalogResult;
}

export function MarketplaceCatalogPanel({ initialCatalog }: MarketplaceCatalogPanelProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState<"" | "FREE" | "PAID">("");
  const [sort, setSort] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => initialCatalog.categories, [initialCatalog.categories]);

  const runSearch = (nextPage = 1) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await searchMarketplaceCatalogAction({
          search: search.trim() || undefined,
          category: category || undefined,
          pricing: pricing || undefined,
          sort,
          page: nextPage,
        });
        if (response.success) {
          setCatalog(response.catalog);
        }
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : "Catalog search failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(1);
        }}
      >
        <input
          className="bg-background rounded-md border px-3 py-2 text-sm"
          placeholder="Search apps, agents, plugins..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search marketplace catalog"
        />
        <select
          className="bg-background rounded-md border px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((entry) => (
            <option key={entry} value={entry}>
              {entry.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          className="bg-background rounded-md border px-3 py-2 text-sm"
          value={pricing}
          onChange={(event) => setPricing(event.target.value as "" | "FREE" | "PAID")}
          aria-label="Filter by pricing"
        >
          <option value="">All pricing</option>
          <option value="FREE">Free</option>
          <option value="PAID">Paid</option>
        </select>
        <select
          className="bg-background rounded-md border px-3 py-2 text-sm"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort catalog"
        >
          {MARKETPLACE_CATALOG_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {isPending ? "Loading..." : "Apply"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {catalog.total} result{catalog.total === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-sm ${viewMode === "grid" ? "bg-muted" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-sm ${viewMode === "list" ? "bg-muted" : ""}`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {isPending ? (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Loading catalog...
        </p>
      ) : viewMode === "grid" ? (
        <MarketplaceItemGrid items={catalog.items} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Publisher</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Version</th>
              </tr>
            </thead>
            <tbody>
              {catalog.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.category.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{item.publisherName}</td>
                  <td className="px-4 py-3">
                    {item.pricingType === "FREE"
                      ? "Free"
                      : `£${(item.priceCents / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {item.averageRating.toFixed(1)} ({item.reviewCount})
                  </td>
                  <td className="px-4 py-3">{item.versionLabel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {catalog.totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={catalog.page <= 1 || isPending}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => runSearch(catalog.page - 1)}
          >
            Previous
          </button>
          <span className="text-muted-foreground text-sm">
            Page {catalog.page} of {catalog.totalPages}
          </span>
          <button
            type="button"
            disabled={catalog.page >= catalog.totalPages || isPending}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => runSearch(catalog.page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
