"use client";

import { LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Grid } from "@/components/common/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffCard } from "@/modules/staff-management/components/staff-card";
import { StaffTable } from "@/modules/staff-management/components/staff-table";
import {
  STAFF_MANAGEMENT_ROUTES,
  STAFF_STATUS_FILTER_OPTIONS,
} from "@/modules/staff-management/constants/routes";
import type { StaffManagementContext } from "@/modules/staff-management/lib/get-staff-management-context";
import type { StaffListResult } from "@/modules/staff-management/types/staff-management-types";

interface StaffListPanelProps {
  context: Pick<StaffManagementContext, "permissionsFlags" | "branches" | "roles">;
  list: StaffListResult;
  initialSearch?: string;
  initialStatus?: string;
  initialBranchId?: string;
  initialDepartment?: string;
  initialRoleId?: string;
}

type ViewMode = "cards" | "table";

export function StaffListPanel({
  context,
  list,
  initialSearch = "",
  initialStatus = "ALL",
  initialBranchId = "",
  initialDepartment = "",
  initialRoleId = "",
}: StaffListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [branchId, setBranchId] = useState(initialBranchId);
  const [department, _setDepartment] = useState(initialDepartment);
  const [roleId, setRoleId] = useState(initialRoleId);

  const applyFilters = (page = 1) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (branchId) params.set("branchId", branchId);
    if (department) params.set("department", department);
    if (roleId) params.set("roleId", roleId);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${STAFF_MANAGEMENT_ROUTES.list}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="staff-search" className="text-sm font-medium">
              Search staff
            </label>
            <div className="relative">
              <Search
                className="text-muted-foreground absolute top-3 left-3 h-4 w-4"
                aria-hidden="true"
              />
              <Input
                id="staff-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, code, or department"
                className="pl-9"
                aria-label="Search staff"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="staff-status-filter" className="text-sm font-medium">
              Status
            </label>
            <select
              id="staff-status-filter"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STAFF_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="staff-branch-filter" className="text-sm font-medium">
              Branch
            </label>
            <select
              id="staff-branch-filter"
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
            <label htmlFor="staff-role-filter" className="text-sm font-medium">
              Role
            </label>
            <select
              id="staff-role-filter"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">All roles</option>
              {context.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
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
          {context.permissionsFlags.canCreate ? (
            <Button asChild>
              <Link href={STAFF_MANAGEMENT_ROUTES.create}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add staff
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {list.total} staff member{list.total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <Grid columns="auto-fit" className="grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
          {list.items.map((member) => (
            <StaffCard key={member.id} member={member} permissions={context.permissionsFlags} />
          ))}
        </Grid>
      ) : (
        <StaffTable items={list.items} permissions={context.permissionsFlags} />
      )}

      {list.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={list.page <= 1 || isPending}
            onClick={() => applyFilters(list.page - 1)}
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
            onClick={() => applyFilters(list.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
