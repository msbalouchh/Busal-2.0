"use client";

import { FolderTree, LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryCard } from "@/modules/category-management/components/category-card";
import { CategoryDashboardStatsCards } from "@/modules/category-management/components/category-dashboard-stats";
import { CategoryEmptyState } from "@/modules/category-management/components/category-empty-state";
import { CategoryTable } from "@/modules/category-management/components/category-table";
import { CategoryTreeView } from "@/modules/category-management/components/category-tree-view";
import {
  CATEGORY_MANAGEMENT_ROUTES,
  CATEGORY_SORT_OPTIONS,
  CATEGORY_STATUS_FILTER_OPTIONS,
} from "@/modules/category-management/constants/routes";
import type { CategoryManagementContext } from "@/modules/category-management/lib/get-category-management-context";
import type {
  CategoryDashboardStats,
  CategoryListResult,
  CategoryTreeNode,
} from "@/modules/category-management/types/category-management-types";

interface CategoryListPanelProps {
  context: Pick<CategoryManagementContext, "permissionsFlags" | "menu">;
  list: CategoryListResult;
  stats: CategoryDashboardStats;
  tree: CategoryTreeNode[];
  initialSearch?: string;
  initialStatus?: string;
  initialParentCategoryId?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
}

type ViewMode = "tree" | "cards" | "table";

export function CategoryListPanel({
  context,
  list,
  stats,
  tree,
  initialSearch = "",
  initialStatus = "ALL",
  initialParentCategoryId = "ALL",
  initialSortBy = "displayOrder",
  initialSortDirection = "asc",
}: CategoryListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [parentCategoryId, setParentCategoryId] = useState(initialParentCategoryId);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const menuId = context.menu.id;

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (parentCategoryId !== "ALL") params.set("parentCategoryId", parentCategoryId);
    if (sortBy !== "displayOrder") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${CATEGORY_MANAGEMENT_ROUTES.list(menuId)}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <CategoryDashboardStatsCards stats={stats} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="category-search" className="text-sm font-medium">
                Search categories
              </label>
              <div className="relative">
                <Search
                  className="text-muted-foreground absolute top-3 left-3 h-4 w-4"
                  aria-hidden="true"
                />
                <Input
                  id="category-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, slug, or description"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="category-status-filter" className="text-sm font-medium">
                Status
              </label>
              <select
                id="category-status-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {CATEGORY_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="category-parent-filter" className="text-sm font-medium">
                Level
              </label>
              <select
                id="category-parent-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={parentCategoryId}
                onChange={(event) => setParentCategoryId(event.target.value)}
              >
                <option value="ALL">All levels</option>
                <option value="ROOT">Root only</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="category-sort-filter" className="text-sm font-medium">
                Sort by
              </label>
              <select
                id="category-sort-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {CATEGORY_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="category-sort-direction" className="text-sm font-medium">
                Direction
              </label>
              <select
                id="category-sort-direction"
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
              variant={viewMode === "tree" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("tree")}
              aria-label="Tree view"
            >
              <FolderTree className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("cards")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            {context.permissionsFlags.canCreate ? (
              <Button asChild>
                <Link href={CATEGORY_MANAGEMENT_ROUTES.create(menuId)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create category
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {list.items.length === 0 ? (
          <CategoryEmptyState menuId={menuId} canCreate={context.permissionsFlags.canCreate} />
        ) : viewMode === "tree" ? (
          <CategoryTreeView
            menuId={menuId}
            tree={tree}
            canReorder={context.permissionsFlags.canUpdate}
          />
        ) : viewMode === "cards" ? (
          <Grid columns="auto-fit">
            {list.items.map((category) => (
              <CategoryCard key={category.id} menuId={menuId} category={category} />
            ))}
          </Grid>
        ) : (
          <CategoryTable menuId={menuId} items={list.items} />
        )}

        {viewMode !== "tree" && list.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Page {list.page} of {list.totalPages} · {list.total} categories
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
