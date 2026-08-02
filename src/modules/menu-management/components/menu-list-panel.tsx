"use client";

import { LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuCard } from "@/modules/menu-management/components/menu-card";
import { MenuDashboardStatsCards } from "@/modules/menu-management/components/menu-dashboard-stats";
import { MenuEmptyState } from "@/modules/menu-management/components/menu-empty-state";
import { MenuTable } from "@/modules/menu-management/components/menu-table";
import {
  MENU_MANAGEMENT_ROUTES,
  MENU_SORT_OPTIONS,
  MENU_STATUS_FILTER_OPTIONS,
  MENU_TYPE_FILTER_OPTIONS,
} from "@/modules/menu-management/constants/routes";
import type { MenuManagementContext } from "@/modules/menu-management/lib/get-menu-management-context";
import type {
  MenuDashboardStats,
  MenuListResult,
} from "@/modules/menu-management/types/menu-management-types";

interface MenuListPanelProps {
  context: Pick<MenuManagementContext, "permissionsFlags" | "branches">;
  list: MenuListResult;
  stats: MenuDashboardStats;
  initialSearch?: string;
  initialStatus?: string;
  initialMenuType?: string;
  initialBranchId?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
}

type ViewMode = "cards" | "table";

export function MenuListPanel({
  context,
  list,
  stats,
  initialSearch = "",
  initialStatus = "ALL",
  initialMenuType = "ALL",
  initialBranchId = "",
  initialSortBy = "displayOrder",
  initialSortDirection = "asc",
}: MenuListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [menuType, setMenuType] = useState(initialMenuType);
  const [branchId, setBranchId] = useState(initialBranchId);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (menuType !== "ALL") params.set("menuType", menuType);
    if (branchId) params.set("branchId", branchId);
    if (sortBy !== "displayOrder") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${MENU_MANAGEMENT_ROUTES.list}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <MenuDashboardStatsCards stats={stats} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="menu-search" className="text-sm font-medium">
                Search menus
              </label>
              <div className="relative">
                <Search
                  className="text-muted-foreground absolute top-3 left-3 h-4 w-4"
                  aria-hidden="true"
                />
                <Input
                  id="menu-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or description"
                  className="pl-9"
                  aria-label="Search menus"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-status-filter" className="text-sm font-medium">
                Status
              </label>
              <select
                id="menu-status-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {MENU_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-type-filter" className="text-sm font-medium">
                Type
              </label>
              <select
                id="menu-type-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={menuType}
                onChange={(event) => setMenuType(event.target.value)}
              >
                {MENU_TYPE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-branch-filter" className="text-sm font-medium">
                Branch
              </label>
              <select
                id="menu-branch-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
              >
                <option value="">All branches</option>
                {context.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-sort-filter" className="text-sm font-medium">
                Sort by
              </label>
              <select
                id="menu-sort-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {MENU_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="menu-sort-direction" className="text-sm font-medium">
                Direction
              </label>
              <select
                id="menu-sort-direction"
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
                <Link href={MENU_MANAGEMENT_ROUTES.create}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create menu
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {list.items.length === 0 ? (
          <MenuEmptyState canCreate={context.permissionsFlags.canCreate} />
        ) : viewMode === "cards" ? (
          <Grid columns="auto-fit">
            {list.items.map((menu) => (
              <MenuCard key={menu.id} menu={menu} />
            ))}
          </Grid>
        ) : (
          <MenuTable items={list.items} />
        )}

        {list.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Page {list.page} of {list.totalPages} · {list.total} menus
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
