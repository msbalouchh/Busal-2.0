"use client";

import { LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { FloorCard } from "@/modules/floor-table-management/components/floor-card";
import { FloorDashboardStatsCards } from "@/modules/floor-table-management/components/floor-dashboard-stats";
import { FloorEmptyState } from "@/modules/floor-table-management/components/floor-empty-state";
import {
  FLOOR_SORT_OPTIONS,
  FLOOR_STATUS_FILTER_OPTIONS,
  FLOOR_TABLE_MANAGEMENT_ROUTES,
} from "@/modules/floor-table-management/constants/routes";
import type { FloorTableManagementContext } from "@/modules/floor-table-management/lib/get-floor-table-management-context";
import type {
  FloorListResult,
  FloorTableDashboardStats,
} from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorListPanelProps {
  context: FloorTableManagementContext;
  list: FloorListResult;
  stats: FloorTableDashboardStats;
  initialSearch?: string;
  initialStatus?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
}

export function FloorListPanel({
  context,
  list,
  stats,
  initialSearch = "",
  initialStatus = "ALL",
  initialSortBy = "displayOrder",
  initialSortDirection = "asc",
}: FloorListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection] = useState(initialSortDirection);
  const branchId = context.selectedBranchId;

  const applyFilters = (page = 1) => {
    if (!branchId) return;

    const params = new URLSearchParams({ branchId });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (sortBy !== "displayOrder") params.set("sortBy", sortBy);
    if (sortDirection !== "asc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${FLOOR_TABLE_MANAGEMENT_ROUTES.floorList()}?${params.toString()}`);
    });
  };

  const handleBranchChange = (nextBranchId: string) => {
    startTransition(() => {
      router.push(FLOOR_TABLE_MANAGEMENT_ROUTES.floorListForBranch(nextBranchId));
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={handleBranchChange}
            placeholder="Select branch"
          />
        </div>
        {branchId && context.permissionsFlags.canCreateFloors ? (
          <Button asChild>
            <Link href={FLOOR_TABLE_MANAGEMENT_ROUTES.floorCreate(branchId)}>
              <Plus className="mr-2 h-4 w-4" />
              Create floor
            </Link>
          </Button>
        ) : null}
      </div>

      {branchId ? (
        <>
          <FloorDashboardStatsCards stats={stats} />

          <div className="space-y-6">
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search floors"
                  className="pl-9"
                />
              </div>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {FLOOR_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {FLOOR_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => applyFilters()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply filters
              </Button>
              <Button variant="outline" size="icon">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <List className="h-4 w-4" />
              </Button>
            </div>

            {list.items.length === 0 ? (
              <FloorEmptyState
                branchId={branchId}
                canCreate={context.permissionsFlags.canCreateFloors}
              />
            ) : (
              <Grid columns="auto-fit">
                {list.items.map((floor) => (
                  <FloorCard key={floor.id} branchId={branchId} floor={floor} />
                ))}
              </Grid>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Select a branch to manage floors and tables.
        </p>
      )}
    </div>
  );
}
