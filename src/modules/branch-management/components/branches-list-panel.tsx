"use client";

import { LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchCard } from "@/modules/branch-management/components/branch-card";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { BranchTable } from "@/modules/branch-management/components/branch-table";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import type { BranchManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import type { BranchListResult } from "@/modules/branch-management/types/branch-management-types";
import { BRANCH_TYPE_OPTIONS } from "@/modules/branch-management/types/branch-management-types";

interface BranchesListPanelProps {
  context: Pick<BranchManagementContext, "permissionsFlags" | "business">;
  list: BranchListResult;
  initialSearch?: string;
  initialStatus?: string;
  initialType?: string;
}

type ViewMode = "cards" | "table";

export function BranchesListPanel({
  context,
  list,
  initialSearch = "",
  initialStatus = "ALL",
  initialType = "ALL",
}: BranchesListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState(initialType);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    list.items.find((branch) => branch.isPrimary)?.id,
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (type !== "ALL") params.set("type", type);
    if (list.page > 1) params.set("page", String(list.page));

    startTransition(() => {
      router.push(`${BRANCH_MANAGEMENT_ROUTES.list}?${params.toString()}`);
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (type !== "ALL") params.set("type", type);
    params.set("page", String(page));

    startTransition(() => {
      router.push(`${BRANCH_MANAGEMENT_ROUTES.list}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="branch-search" className="text-sm font-medium">
              Search branches
            </label>
            <div className="relative">
              <Search
                className="text-muted-foreground absolute top-3 left-3 h-4 w-4"
                aria-hidden="true"
              />
              <Input
                id="branch-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, code, city, or country"
                className="pl-9"
                aria-label="Search branches"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="branch-status-filter" className="text-sm font-medium">
              Status
            </label>
            <select
              id="branch-status-filter"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="branch-type-filter" className="text-sm font-medium">
              Type
            </label>
            <select
              id="branch-type-filter"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="ALL">All types</option>
              {BRANCH_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={applyFilters} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply filters
          </Button>
          {context.permissionsFlags.canCreate ? (
            <Button asChild>
              <Link href={BRANCH_MANAGEMENT_ROUTES.create}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create branch
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Branch selector preview</p>
          <p className="text-muted-foreground text-sm">
            Reusable selector for future modules that operate per branch.
          </p>
        </div>
        <BranchSelector
          branches={list.items}
          value={selectedBranchId}
          onValueChange={setSelectedBranchId}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Showing {list.items.length} of {list.total} branches
        </p>
        <div className="flex gap-2" role="group" aria-label="View mode">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
            aria-pressed={viewMode === "cards"}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          No branches match your filters.
        </div>
      ) : viewMode === "cards" ? (
        <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
          {list.items.map((branch) => (
            <BranchCard key={branch.id} branch={branch} permissions={context.permissionsFlags} />
          ))}
        </Grid>
      ) : (
        <BranchTable branches={list.items} permissions={context.permissionsFlags} />
      )}

      {list.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={list.page <= 1 || isPending}
            onClick={() => goToPage(list.page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {list.page} of {list.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={list.page >= list.totalPages || isPending}
            onClick={() => goToPage(list.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
