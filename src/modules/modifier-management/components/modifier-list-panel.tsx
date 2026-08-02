"use client";

import { LayoutGrid, Link2, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModifierCard } from "@/modules/modifier-management/components/modifier-card";
import { ModifierDashboardStatsCards } from "@/modules/modifier-management/components/modifier-dashboard-stats";
import { ModifierEmptyState } from "@/modules/modifier-management/components/modifier-empty-state";
import { ModifierTable } from "@/modules/modifier-management/components/modifier-table";
import {
  MODIFIER_MANAGEMENT_ROUTES,
  MODIFIER_SELECTION_TYPE_FILTER_OPTIONS,
  MODIFIER_SORT_OPTIONS,
  MODIFIER_STATUS_FILTER_OPTIONS,
} from "@/modules/modifier-management/constants/routes";
import type { ModifierManagementContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import type {
  ModifierDashboardStats,
  ModifierListResult,
} from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierListPanelProps {
  context: Pick<ModifierManagementContext, "permissionsFlags" | "menu">;
  list: ModifierListResult;
  stats: ModifierDashboardStats;
  initialSearch?: string;
  initialStatus?: string;
  initialSelectionType?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
}

type ViewMode = "cards" | "table";

export function ModifierListPanel({
  context,
  list,
  stats,
  initialSearch = "",
  initialStatus = "ALL",
  initialSelectionType = "ALL",
  initialSortBy = "displayOrder",
  initialSortDirection = "asc",
}: ModifierListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [selectionType, setSelectionType] = useState(initialSelectionType);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const menuId = context.menu.id;

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (selectionType !== "ALL") params.set("selectionType", selectionType);
    if (sortBy !== "displayOrder") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${MODIFIER_MANAGEMENT_ROUTES.list(menuId)}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8">
      <ModifierDashboardStatsCards stats={stats} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="modifier-search" className="text-sm font-medium">
                Search modifier groups
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  id="modifier-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or description"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="modifier-status-filter" className="text-sm font-medium">
                Status
              </label>
              <select
                id="modifier-status-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {MODIFIER_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="modifier-selection-filter" className="text-sm font-medium">
                Selection type
              </label>
              <select
                id="modifier-selection-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={selectionType}
                onChange={(event) => setSelectionType(event.target.value)}
              >
                {MODIFIER_SELECTION_TYPE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="modifier-sort-filter" className="text-sm font-medium">
                Sort by
              </label>
              <select
                id="modifier-sort-filter"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {MODIFIER_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="modifier-sort-direction" className="text-sm font-medium">
                Direction
              </label>
              <select
                id="modifier-sort-direction"
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
            {context.permissionsFlags.canAssign ? (
              <Button asChild variant="outline">
                <Link href={MODIFIER_MANAGEMENT_ROUTES.assign(menuId)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Assign to products
                </Link>
              </Button>
            ) : null}
            {context.permissionsFlags.canCreate ? (
              <Button asChild>
                <Link href={MODIFIER_MANAGEMENT_ROUTES.create(menuId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create group
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {list.items.length === 0 ? (
          <ModifierEmptyState menuId={menuId} canCreate={context.permissionsFlags.canCreate} />
        ) : viewMode === "cards" ? (
          <Grid columns="auto-fit">
            {list.items.map((modifierGroup) => (
              <ModifierCard key={modifierGroup.id} menuId={menuId} modifierGroup={modifierGroup} />
            ))}
          </Grid>
        ) : (
          <ModifierTable menuId={menuId} modifierGroups={list.items} />
        )}

        {list.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {list.page} of {list.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending || list.page <= 1}
                onClick={() => applyFilters(list.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending || list.page >= list.totalPages}
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
