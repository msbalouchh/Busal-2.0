"use client";

import { Download, LayoutGrid, List, Loader2, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bulkExportProductsAction,
  bulkUpdateProductStatusAction,
} from "@/modules/product-management/actions/product-management-actions";
import { ProductCard } from "@/modules/product-management/components/product-card";
import { ProductDashboardStatsCards } from "@/modules/product-management/components/product-dashboard-stats";
import { ProductEmptyState } from "@/modules/product-management/components/product-empty-state";
import { ProductTable } from "@/modules/product-management/components/product-table";
import {
  PRODUCT_DIETARY_FILTER_OPTIONS,
  PRODUCT_MANAGEMENT_ROUTES,
  PRODUCT_SORT_OPTIONS,
  PRODUCT_STATUS_FILTER_OPTIONS,
  PRODUCT_TYPE_FILTER_OPTIONS,
} from "@/modules/product-management/constants/routes";
import type { ProductManagementContext } from "@/modules/product-management/lib/get-product-management-context";
import type {
  ProductDashboardStats,
  ProductListResult,
} from "@/modules/product-management/types/product-management-types";

interface ProductListPanelProps {
  context: ProductManagementContext;
  list: ProductListResult;
  stats: ProductDashboardStats;
  initialSearch?: string;
  initialStatus?: string;
  initialProductType?: string;
  initialCategoryId?: string;
  initialDietary?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
}

type ViewMode = "cards" | "table";

export function ProductListPanel({
  context,
  list,
  stats,
  initialSearch = "",
  initialStatus = "ALL",
  initialProductType = "ALL",
  initialCategoryId = "",
  initialDietary = "ALL",
  initialSortBy = "displayOrder",
  initialSortDirection = "asc",
}: ProductListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [productType, setProductType] = useState(initialProductType);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [dietary, setDietary] = useState(initialDietary);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const menuId = context.menu.id;

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (productType !== "ALL") params.set("productType", productType);
    if (categoryId) params.set("categoryId", categoryId);
    if (dietary !== "ALL") params.set("dietary", dietary);
    if (sortBy !== "displayOrder") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${PRODUCT_MANAGEMENT_ROUTES.list(menuId)}?${params.toString()}`);
    });
  };

  const toggleSelect = (productId: string) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const handleBulkStatus = (nextStatus: "ACTIVE" | "INACTIVE" | "ARCHIVED") => {
    startTransition(async () => {
      try {
        await bulkUpdateProductStatusAction({
          menuId,
          productIds: selectedIds,
          status: nextStatus,
        });
        toast.success("Bulk status updated");
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk update failed");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await bulkExportProductsAction(menuId, {
          search,
          status: status as never,
          productType: productType as never,
          categoryId: categoryId || undefined,
          dietary: dietary as never,
          sortBy: sortBy as never,
          sortDirection: sortDirection as "asc" | "desc",
        });
        const blob = new Blob([JSON.stringify(result.export, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `menu-${menuId}-products.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${result.export.count} products`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Export failed");
      }
    });
  };

  return (
    <div className="space-y-8">
      <ProductDashboardStatsCards stats={stats} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="product-search" className="text-sm font-medium">
                Search products
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  id="product-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, SKU, or barcode"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="product-status-filter"
              label="Status"
              value={status}
              onChange={setStatus}
              options={PRODUCT_STATUS_FILTER_OPTIONS}
            />
            <FilterSelect
              id="product-type-filter"
              label="Type"
              value={productType}
              onChange={setProductType}
              options={PRODUCT_TYPE_FILTER_OPTIONS}
            />
            <div className="space-y-2">
              <label htmlFor="product-category-filter" className="text-sm font-medium">
                Category
              </label>
              <select
                id="product-category-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">All categories</option>
                {context.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <FilterSelect
              id="product-dietary-filter"
              label="Dietary"
              value={dietary}
              onChange={setDietary}
              options={PRODUCT_DIETARY_FILTER_OPTIONS}
            />
            <FilterSelect
              id="product-sort-filter"
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={PRODUCT_SORT_OPTIONS}
            />
            <div className="space-y-2">
              <label htmlFor="product-sort-direction" className="text-sm font-medium">
                Direction
              </label>
              <select
                id="product-sort-direction"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => applyFilters()}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply filters
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            {context.permissionsFlags.canExport ? (
              <Button type="button" variant="outline" onClick={handleExport} disabled={isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            ) : null}
            {context.permissionsFlags.canImport ? (
              <Button asChild variant="outline">
                <Link href={`${PRODUCT_MANAGEMENT_ROUTES.create(menuId)}?import=1`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button asChild>
                <Link href={PRODUCT_MANAGEMENT_ROUTES.create(menuId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create product
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {selectedIds.length > 0 && context.permissionsFlags.canUpdate ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkStatus("ACTIVE")}
            >
              Set active
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleBulkStatus("INACTIVE")}
            >
              Set inactive
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleBulkStatus("ARCHIVED")}
            >
              Archive
            </Button>
          </div>
        ) : null}

        {list.items.length === 0 ? (
          <ProductEmptyState menuId={menuId} canCreate={context.permissionsFlags.canCreate} />
        ) : viewMode === "cards" ? (
          <Grid columns="auto-fit">
            {list.items.map((product) => (
              <ProductCard key={product.id} menuId={menuId} product={product} />
            ))}
          </Grid>
        ) : (
          <ProductTable
            menuId={menuId}
            items={list.items}
            selectedIds={selectedIds}
            onToggleSelect={context.permissionsFlags.canUpdate ? toggleSelect : undefined}
          />
        )}

        {list.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Page {list.page} of {list.totalPages} · {list.total} products
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={list.page <= 1 || isPending}
                onClick={() => applyFilters(list.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={list.page >= list.totalPages || isPending}
                onClick={() => applyFilters(list.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
